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
      wsUrl: `ws://127.0.0.1:${serverPort}/ws`,
    });

    const overview = await api.overview.get();

    expect(overview.summary.devices.actuatorCamera).toBe(3);
    expect(overview.actuators[0]?.lastRunDurationSec).toBe(10);
  });

  it('subscribes to requested channels and delivers documented system status events', () => {
    class FakeWebSocket {
      static current: FakeWebSocket | undefined;
      static connectionCount = 0;

      readonly sentMessages: string[] = [];
      private readonly listeners = new Map<string, Set<(event: Event) => void>>();

      constructor() {
        FakeWebSocket.current = this;
        FakeWebSocket.connectionCount += 1;
      }

      addEventListener(eventName: string, listener: (event: Event) => void): void {
        const eventListeners = this.listeners.get(eventName) ?? new Set<(event: Event) => void>();
        eventListeners.add(listener);
        this.listeners.set(eventName, eventListeners);
      }
      close(): void {}
      send(message: string): void {
        this.sentMessages.push(message);
      }
      open(): void {
        this.emit('open', new Event('open'));
      }
      receive(payload: unknown): void {
        this.emit('message', new MessageEvent('message', { data: JSON.stringify(payload) }));
      }
      private emit(eventName: string, event: Event): void {
        for (const listener of this.listeners.get(eventName) ?? []) listener(event);
      }
    }
    vi.stubGlobal('WebSocket', FakeWebSocket);
    const api = createGatewayApi({
      apiBaseUrl: `http://127.0.0.1:${serverPort}/api/v1`,
      requestTimeoutMs: 1_000,
      wsUrl: `ws://127.0.0.1:${serverPort}/ws`,
    });
    const onEvent = vi.fn();
    const onTelemetryEvent = vi.fn();

    api.socket.connect({
      channels: ['system.status'],
      onError: vi.fn(),
      onEvent,
      onStateChange: vi.fn(),
    });
    api.socket.connect({
      channels: ['telemetry'],
      onError: vi.fn(),
      onEvent: onTelemetryEvent,
      onStateChange: vi.fn(),
    });

    const socket = FakeWebSocket.current;
    if (!socket) throw new TypeError('Expected a WebSocket connection.');

    expect(FakeWebSocket.connectionCount).toBe(1);
    socket.open();
    socket.receive({
      channel: 'system.status',
      gateway: 'NORMAL',
      localDb: 'NORMAL',
      wifiAp: 'ACTIVE',
      bleBeacon: 'ACTIVE',
      mqttBroker: 'RUNNING',
      cloudSync: 'ONLINE',
      lastSyncAt: '2026-08-29T15:31:02+09:00',
      alertCount: 1,
    });

    expect(socket.sentMessages).toEqual([
      JSON.stringify({ type: 'subscribe', channels: ['system.status', 'telemetry'] }),
    ]);
    expect(onEvent).toHaveBeenCalledWith({
      channel: 'system.status',
      gateway: 'NORMAL',
      localDb: 'NORMAL',
      wifiAp: 'ACTIVE',
      bleBeacon: 'ACTIVE',
      mqttBroker: 'RUNNING',
      cloudSync: 'ONLINE',
      lastSyncAt: '2026-08-29T15:31:02+09:00',
      alertCount: 1,
    });
    expect(onTelemetryEvent).not.toHaveBeenCalled();
  });

  it('returns parsed system status when the Gateway responds', async () => {
    const api = createGatewayApi({
      apiBaseUrl: `http://127.0.0.1:${serverPort}/api/v1`,
      requestTimeoutMs: 1_000,
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
      wsUrl: `ws://127.0.0.1:${serverPort}/ws`,
    });

    const request = api.system.getStatus();

    await expect(request).rejects.toBeInstanceOf(ZodError);
  });
});
