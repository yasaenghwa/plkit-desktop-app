import { createServer, type Server } from 'node:http';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { createGatewayApi } from './gateway-api';

const listen = (server: Server): Promise<number> =>
  new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address === null || typeof address === 'string') {
        reject(new TypeError('Expected a TCP server address.'));
        return;
      }
      resolve(address.port);
    });
  });

const server = createServer((request, response) => {
  response.setHeader('content-type', 'application/json');
  if (request.url === '/api/v1/overview') {
    response.end(
      JSON.stringify({
        summary: {
          gateway: 'NORMAL',
          devices: { online: 6, total: 7, sensor: 4, actuatorCamera: 3 },
          cloudSync: { state: 'ONLINE', lastSyncAt: '2026-09-06T11:53:53.153Z' },
          alerts: 1,
        },
        environment: [],
        actuators: [
          {
            deviceId: 'pump-001',
            name: 'Water Pump',
            state: 'OFF',
            lastRunAt: '2026-09-06T11:53:53.153Z',
            lastRunDurationSec: 10,
          },
        ],
        recentEvents: [],
        latestImage: null,
      }),
    );
    return;
  }
  if (request.url === '/invalid/api/v1/system/status') {
    response.end(JSON.stringify({ gateway: 'BROKEN' }));
    return;
  }
  if (request.url !== '/api/v1/system/status') {
    response.writeHead(404).end();
    return;
  }
  response.end(
    JSON.stringify({
      gateway: 'NORMAL',
      localDb: 'NORMAL',
      wifiAp: 'ACTIVE',
      bleBeacon: 'ACTIVE',
      mqttBroker: 'RUNNING',
      cloudSync: 'ONLINE',
      lastSyncAt: '2026-08-29T15:31:02+09:00',
      alertCount: 1,
    }),
  );
});

let serverPort = 0;

beforeAll(async () => {
  serverPort = await listen(server);
});

afterAll(
  () =>
    new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    }),
);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('gateway API connection', () => {
  it('parses the Overview response returned by Gateway Core', async () => {
    const api = createGatewayApi({
      apiBaseUrl: `http://127.0.0.1:${serverPort}/api/v1`,
      requestTimeoutMs: 1_000,
      wsEnabled: false,
      wsUrl: `ws://127.0.0.1:${serverPort}/ws`,
    });

    const overview = await api.overview.get();

    expect(overview.summary.devices.actuatorCamera).toBe(3);
    expect(overview.actuators[0]?.lastRunDurationSec).toBe(10);
  });

  it('does not create a WebSocket when realtime transport is disabled', () => {
    let connectionCount = 0;
    class FakeWebSocket {
      constructor() {
        connectionCount += 1;
      }

      addEventListener(): void {}
      close(): void {}
      send(): void {}
    }
    vi.stubGlobal('WebSocket', FakeWebSocket);
    const api = createGatewayApi({
      apiBaseUrl: `http://127.0.0.1:${serverPort}/api/v1`,
      requestTimeoutMs: 1_000,
      wsEnabled: false,
      wsUrl: `ws://127.0.0.1:${serverPort}/ws`,
    });
    const onStateChange = vi.fn();

    const disconnect = api.socket.connect({
      channels: ['telemetry'],
      onError: vi.fn(),
      onEvent: vi.fn(),
      onStateChange,
    });

    expect(connectionCount).toBe(0);
    expect(onStateChange).toHaveBeenCalledWith('disabled');
    disconnect();
  });

  it('returns parsed system status when the Gateway responds', async () => {
    const api = createGatewayApi({
      apiBaseUrl: `http://127.0.0.1:${serverPort}/api/v1`,
      requestTimeoutMs: 1_000,
      wsEnabled: false,
      wsUrl: `ws://127.0.0.1:${serverPort}/ws`,
    });

    const status = await api.system.getStatus();

    expect(status.cloudSync).toBe('ONLINE');
    expect(status.alertCount).toBe(1);
  });

  it('rejects a response that violates the Gateway contract', async () => {
    const api = createGatewayApi({
      apiBaseUrl: `http://127.0.0.1:${serverPort}/invalid/api/v1`,
      requestTimeoutMs: 1_000,
      wsEnabled: false,
      wsUrl: `ws://127.0.0.1:${serverPort}/ws`,
    });

    const request = api.system.getStatus();

    await expect(request).rejects.toBeInstanceOf(ZodError);
  });
});
