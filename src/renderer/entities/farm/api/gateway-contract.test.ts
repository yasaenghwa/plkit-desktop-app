/**
 * The app against responses recorded from gateway-core (develop 284aeeb, SSOT v2 — Confluence HTTP/WS Endpoints).
 * Each fixture is what the gateway really sends, so a schema that drifts from the gateway
 * fails here instead of in front of a user as "cannot connect".
 */
import { readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEFAULT_GATEWAY_SETTINGS } from '../../../../gateway-settings';
import { createGatewayApi } from './gateway-api';
import { gatewaySocketMessageSchema } from './operations-contracts';

const fixture = (name: string): string =>
  readFileSync(join(__dirname, '__fixtures__', 'gateway-core', `${name}.json`), 'utf8');

const ROUTES: Record<string, string> = {
  '/api/v1/overview': 'overview',
  '/api/v1/system/network': 'system-network',
  '/api/v1/devices/core-002': 'device-core-002',
  '/api/v1/actuators': 'actuators',
  '/api/v1/cameras/growth-cam-001/images': 'camera-images',
  '/api/v1/history/actuator': 'history-actuator',
};

const requests: { method: string; url: string; contentType: string | undefined }[] = [];

const server: Server = createServer((request: IncomingMessage, response) => {
  requests.push({
    method: request.method ?? '',
    url: request.url ?? '',
    contentType: request.headers['content-type'],
  });
  const path = (request.url ?? '').split('?')[0] ?? '';
  if (request.method === 'PATCH' && path === '/api/v1/devices/core-002/meta') {
    // gateway-core answers 415 unless the body is a JSON merge patch
    const ok = request.headers['content-type'] === 'application/merge-patch+json';
    response.writeHead(ok ? 200 : 415, {
      'content-type': ok ? 'application/json' : 'application/problem+json',
    });
    response.end(
      ok
        ? fixture('device-meta-patch')
        : JSON.stringify({
            type: 'about:blank',
            title: 'Unsupported Media Type',
            status: 415,
            detail: 'Content-Type must be application/merge-patch+json',
            instance: path,
            code: 'UNSUPPORTED_MEDIA_TYPE',
          }),
    );
    return;
  }
  const name = request.method === 'GET' ? ROUTES[path] : undefined;
  if (name === undefined) {
    response.writeHead(404, { 'content-type': 'application/problem+json' });
    response.end(
      JSON.stringify({
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: path,
        instance: path,
        code: 'NOT_FOUND',
      }),
    );
    return;
  }
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(fixture(name));
});

let api: ReturnType<typeof createGatewayApi>;

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (address === null || typeof address === 'string')
    throw new TypeError('Expected a TCP address.');
  api = createGatewayApi({
    apiBaseUrl: `http://127.0.0.1:${address.port}/api/v1`,
    requestTimeoutMs: 1_000,
    wsUrl: `ws://127.0.0.1:${address.port}/ws`,
  });
});

afterAll(
  () =>
    new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    ),
);

describe('gateway-core contract', () => {
  it('reads when an actuator last ran, null when it never did', async () => {
    const overview = await api.overview.get();
    const [pump, ...rest] = overview.actuators;
    expect(pump?.lastRunAt).not.toBeNull();
    expect(pump?.lastRunDurationSec).toBe(1);
    expect(rest.every((a) => a.lastRunAt === null && a.lastRunDurationSec === null)).toBe(true);
  });

  it('accepts an inactive AP (clients and dhcpRange null)', async () => {
    const network = await api.system.network();
    expect([network.ap.clients, network.ap.dhcpRange]).toEqual([null, null]);
  });

  it('reads hardware.hardwareRevision', async () => {
    const device = await api.devices.get('core-002');
    expect(device.hardware.hardwareRevision).toBe(1);
  });

  it('reads lastCommand.command', async () => {
    const actuators = await api.actuators.list();
    expect(
      actuators.items.every(
        (a) => a.lastCommand === null || typeof a.lastCommand.command === 'string',
      ),
    ).toBe(true);
  });

  it('accepts actuator history with unknown before-state (null)', async () => {
    const history = await api.history.actuator();
    expect(history.items.map((i) => [i.command, i.stateBefore, i.stateAfter])).toEqual([
      ['RUN', 'OFF', 'OFF'],
      ['OFF', 'ON', 'OFF'],
      ['ON', null, 'ON'],
    ]);
  });

  it('calls the plural /cameras routes and reads lastControl as an object', async () => {
    const images = await api.camera.images('growth-cam-001');
    expect(requests.some((r) => r.url.startsWith('/api/v1/cameras/growth-cam-001/images'))).toBe(
      true,
    );
    expect(images.items[0]?.snapshot.lastControl?.command).toBe('RUN');
  });

  it('sends the device meta PATCH as merge-patch+json', async () => {
    await api.devices.updateMeta('core-002', { displayName: '로메인 A 토양수분' });
    expect(requests.find((r) => r.method === 'PATCH')?.contentType).toBe(
      'application/merge-patch+json',
    );
  });
});

describe('gateway-core WebSocket frames', () => {
  it('accepts DEVICE_DISCOVERED with descriptor.hardwareRevision', () => {
    // app/ws/protocol.py device_discovered(DISCOVERED_DESCRIPTOR) in gateway-core
    const frame = {
      channel: 'event',
      type: 'DEVICE_DISCOVERED',
      at: '2026-09-25T09:21:28.554Z',
      descriptor: {
        deviceId: 'core-A81F',
        moduleClass: 'SENSOR',
        moduleType: 'SOIL_MOISTURE',
        moduleModel: 'PLKIT_SOIL_V1',
        hardwareRevision: 1,
      },
    };
    expect(gatewaySocketMessageSchema.safeParse(frame).success).toBe(true);
  });
});

describe('Local defaults', () => {
  it("point at gateway-core's default port", () => {
    expect(DEFAULT_GATEWAY_SETTINGS.localApiBaseUrl).toBe('http://localhost:8000/api/v1');
    expect(DEFAULT_GATEWAY_SETTINGS.localWsUrl).toBe('ws://localhost:8000/ws');
  });
});
