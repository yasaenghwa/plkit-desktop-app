import { createGatewayHttpClient } from '@shared/api';
import { GATEWAY_ENDPOINTS } from '@shared/config';
import type { GatewayRuntimeConfig } from '@shared/config';

import {
  actuatorCommandSchema,
  actuatorListSchema,
  cameraCaptureSchema,
  cameraImagesSchema,
  deviceDetailSchema,
  deviceListSchema,
  deviceMetaSchema,
  deviceRegistrationSchema,
  overviewSchema,
  telemetryLatestSchema,
  telemetrySeriesSchema,
} from './monitoring-contracts';
import {
  actuatorHistorySchema,
  assistantContextSchema,
  assistantMessageSchema,
  assistantSessionsSchema,
  cameraHistorySchema,
  eventHistorySchema,
  gatewaySocketMessageSchema,
  gatewayStatusSchema,
  mqttStatusSchema,
  networkStatusSchema,
  sensorHistorySchema,
  syncRunSchema,
  syncStatusSchema,
  systemLogsSchema,
  systemStatusSchema,
} from './operations-contracts';
import type { GatewaySocketEvent } from './operations-contracts';

type DeviceListQuery = {
  readonly class?: 'actuator' | 'camera' | 'sensor';
  readonly cursor?: string;
  readonly limit?: number;
};

type DeviceMetadataInput = {
  readonly displayName?: string;
  readonly zone?: string;
  readonly plant?: string;
  readonly description?: string;
};

type DeviceRegistrationInput = {
  readonly displayName: string;
  readonly zone: string;
  readonly plant: string;
  readonly description: string;
};

type ActuatorCommandInput =
  | { readonly command: 'OFF' | 'ON'; readonly origin: 'USER' }
  | { readonly command: 'RUN'; readonly durationSec: number; readonly origin: 'USER' };

type CursorQuery = { readonly cursor?: string; readonly limit?: number };
type SocketState = 'closed' | 'connecting' | 'open';
type SocketChannel = GatewaySocketEvent['channel'];

type GatewaySocketOptions = {
  readonly channels: readonly SocketChannel[];
  readonly onError: (error: Error) => void;
  readonly onEvent: (event: GatewaySocketEvent) => void;
  readonly onStateChange: (state: SocketState) => void;
};

class GatewaySocketPayloadError extends Error {
  readonly name = 'GatewaySocketPayloadError';

  constructor(cause?: unknown) {
    super('Gateway WebSocket payload does not match the documented contract.', { cause });
  }
}

class GatewaySocketConnectionError extends Error {
  readonly name = 'GatewaySocketConnectionError';

  constructor() {
    super('Gateway WebSocket connection failed.');
  }
}

type SearchParamEntry = readonly [key: string, value: string | number | undefined];

const createSearchParams = (entries: readonly SearchParamEntry[]): URLSearchParams => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value !== undefined) searchParams.set(key, String(value));
  }
  return searchParams;
};

const toQuery = (query: CursorQuery): URLSearchParams =>
  createSearchParams([
    ['cursor', query.cursor],
    ['limit', query.limit],
  ]);

export const createGatewayApi = (config: GatewayRuntimeConfig) => {
  const http = createGatewayHttpClient(config.apiBaseUrl, config.requestTimeoutMs ?? 8_000);
  const socketSubscribers = new Set<GatewaySocketOptions>();
  const subscribedChannels = new Set<SocketChannel>();
  let socket: WebSocket | undefined;
  let socketState: SocketState = 'closed';

  const notifySocketState = (state: SocketState): void => {
    socketState = state;
    for (const subscriber of socketSubscribers) subscriber.onStateChange(state);
  };

  const getPendingChannels = (): SocketChannel[] => {
    const channels: SocketChannel[] = [];
    for (const subscriber of socketSubscribers) {
      for (const channel of subscriber.channels) {
        if (!subscribedChannels.has(channel) && !channels.includes(channel)) channels.push(channel);
      }
    }
    return channels;
  };

  const subscribePendingChannels = (): void => {
    if (!socket || socketState !== 'open') return;
    const channels = getPendingChannels();
    if (channels.length === 0) return;
    socket.send(JSON.stringify({ type: 'subscribe', channels }));
    for (const channel of channels) subscribedChannels.add(channel);
  };

  const openSocket = (): void => {
    const connection = new WebSocket(config.wsUrl);
    socket = connection;
    notifySocketState('connecting');
    connection.addEventListener('open', () => {
      if (socket !== connection) return;
      notifySocketState('open');
      subscribePendingChannels();
    });
    connection.addEventListener('message', (message) => {
      try {
        const payload: unknown =
          typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
        const parsedMessage = gatewaySocketMessageSchema.parse(payload);
        if (parsedMessage.channel === 'control') return;
        for (const subscriber of socketSubscribers) {
          if (subscriber.channels.includes(parsedMessage.channel))
            subscriber.onEvent(parsedMessage);
        }
      } catch (error) {
        const socketError = new GatewaySocketPayloadError(error);
        for (const subscriber of socketSubscribers) subscriber.onError(socketError);
      }
    });
    connection.addEventListener('error', () => {
      if (socket !== connection) return;
      const socketError = new GatewaySocketConnectionError();
      for (const subscriber of socketSubscribers) subscriber.onError(socketError);
    });
    connection.addEventListener('close', () => {
      if (socket !== connection) return;
      socket = undefined;
      subscribedChannels.clear();
      notifySocketState('closed');
    });
  };

  return {
    overview: {
      get: (signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.overview, overviewSchema, { signal }),
    },
    devices: {
      list: (query: DeviceListQuery = {}, signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.devices, deviceListSchema, {
          searchParams: createSearchParams([
            ['class', query.class],
            ['cursor', query.cursor],
            ['limit', query.limit],
          ]),
          signal,
        }),
      get: (deviceId: string, signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.device(deviceId), deviceDetailSchema, { signal }),
      register: (deviceId: string, input: DeviceRegistrationInput, signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.deviceRegistration(deviceId), deviceRegistrationSchema, {
          body: input,
          method: 'post',
          signal,
        }),
      updateMeta: (deviceId: string, input: DeviceMetadataInput, signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.deviceMeta(deviceId), deviceMetaSchema, {
          body: input,
          contentType: 'application/merge-patch+json',
          method: 'patch',
          signal,
        }),
    },
    telemetry: {
      latest: (signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.telemetryLatest, telemetryLatestSchema, { signal }),
      series: (deviceId: string, signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.telemetrySeries(deviceId), telemetrySeriesSchema, {
          searchParams: createSearchParams([
            ['window', '60m'],
            ['interval', '1m'],
          ]),
          signal,
        }),
    },
    actuators: {
      list: (signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.actuators, actuatorListSchema, { signal }),
      command: (deviceId: string, input: ActuatorCommandInput, signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.actuatorCommands(deviceId), actuatorCommandSchema, {
          body: input,
          method: 'post',
          signal,
        }),
    },
    camera: {
      capture: (deviceId: string, signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.cameraCaptures(deviceId), cameraCaptureSchema, {
          method: 'post',
          signal,
        }),
      images: (deviceId: string, query: CursorQuery = {}, signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.cameraImages(deviceId), cameraImagesSchema, {
          searchParams: toQuery(query),
          signal,
        }),
    },
    history: {
      sensor: (deviceId: string, signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.historySensor, sensorHistorySchema, {
          searchParams: createSearchParams([
            ['deviceId', deviceId],
            ['window', '24h'],
          ]),
          signal,
        }),
      actuator: (query: CursorQuery = {}, signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.historyActuator, actuatorHistorySchema, {
          searchParams: toQuery(query),
          signal,
        }),
      camera: (query: CursorQuery = {}, signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.historyCamera, cameraHistorySchema, {
          searchParams: toQuery(query),
          signal,
        }),
      events: (query: CursorQuery = {}, signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.historyEvents, eventHistorySchema, {
          searchParams: toQuery(query),
          signal,
        }),
      sensorExportUrl: (deviceId: string): string => {
        const url = new URL(`${config.apiBaseUrl}/${GATEWAY_ENDPOINTS.historySensorExport}`);
        url.searchParams.set('deviceId', deviceId);
        url.searchParams.set('window', '24h');
        return url.toString();
      },
    },
    system: {
      getStatus: (signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.systemStatus, systemStatusSchema, { signal }),
      gateway: (signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.systemGateway, gatewayStatusSchema, { signal }),
      network: (signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.systemNetwork, networkStatusSchema, { signal }),
      mqtt: (signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.systemMqtt, mqttStatusSchema, { signal }),
      sync: (signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.systemSync, syncStatusSchema, { signal }),
      runSync: (signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.systemSyncRuns, syncRunSchema, {
          method: 'post',
          signal,
        }),
      logs: (level?: 'error' | 'info' | 'warn', signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.systemLogs, systemLogsSchema, {
          searchParams: createSearchParams([
            ['level', level],
            ['limit', 200],
          ]),
          signal,
        }),
    },
    assistant: {
      context: (signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.assistantContext, assistantContextSchema, { signal }),
      sessions: (signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.assistantSessions, assistantSessionsSchema, {
          searchParams: createSearchParams([['limit', 20]]),
          signal,
        }),
      send: (sessionId: string, message: string, signal?: AbortSignal) =>
        http.request(GATEWAY_ENDPOINTS.assistantMessage(sessionId), assistantMessageSchema, {
          body: { context: { includeFarmState: true }, message },
          method: 'post',
          signal,
        }),
    },
    socket: {
      connect: (options: GatewaySocketOptions): (() => void) => {
        socketSubscribers.add(options);
        if (socket) {
          options.onStateChange(socketState);
          subscribePendingChannels();
        } else {
          openSocket();
        }
        return () => {
          socketSubscribers.delete(options);
          if (socketSubscribers.size === 0) socket?.close();
        };
      },
    },
  } as const;
};

export type GatewayApi = ReturnType<typeof createGatewayApi>;
