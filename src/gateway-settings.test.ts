import { describe, expect, it } from 'vitest';

import {
  DEFAULT_GATEWAY_SETTINGS,
  MOCK_GATEWAY_URLS,
  gatewaySettingsSchema,
} from './gateway-settings';
import {
  getGatewayRuntimeConfig,
  initializeGatewayRuntime,
} from './renderer/shared/config/gateway-runtime';

describe('Gateway connection settings', () => {
  it('starts in Mock mode and selects the simulator REST and WebSocket endpoints', () => {
    initializeGatewayRuntime(DEFAULT_GATEWAY_SETTINGS);
    expect(getGatewayRuntimeConfig()).toMatchObject(MOCK_GATEWAY_URLS);
  });

  it('selects both Local endpoints, including a custom port', () => {
    const settings = gatewaySettingsSchema.parse({
      mode: 'local',
      localApiBaseUrl: 'http://localhost:8080/api/v1',
      localWsUrl: 'ws://localhost:8080/ws',
    });
    initializeGatewayRuntime(settings);
    expect(getGatewayRuntimeConfig()).toMatchObject({
      apiBaseUrl: 'http://localhost:8080/api/v1',
      wsUrl: 'ws://localhost:8080/ws',
    });
  });

  it('rejects wrong schemes and API paths', () => {
    expect(
      gatewaySettingsSchema.safeParse({
        ...DEFAULT_GATEWAY_SETTINGS,
        localApiBaseUrl: 'file:///api/v1',
      }).success,
    ).toBe(false);
    expect(
      gatewaySettingsSchema.safeParse({
        ...DEFAULT_GATEWAY_SETTINGS,
        localWsUrl: 'ws://localhost/not-ws',
      }).success,
    ).toBe(false);
  });
});
