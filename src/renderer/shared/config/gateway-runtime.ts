import { MOCK_GATEWAY_URLS, type GatewaySettings } from '../../../gateway-settings';

export type GatewayRuntimeConfig = {
  readonly apiBaseUrl: string;
  readonly requestTimeoutMs: number;
  readonly wsUrl: string;
};

let runtimeConfig: GatewayRuntimeConfig = {
  ...MOCK_GATEWAY_URLS,
  requestTimeoutMs: 8_000,
};

export const initializeGatewayRuntime = (settings: GatewaySettings): void => {
  runtimeConfig = {
    apiBaseUrl:
      settings.mode === 'mock'
        ? MOCK_GATEWAY_URLS.apiBaseUrl
        : settings.localApiBaseUrl.replace(/\/$/, ''),
    wsUrl: settings.mode === 'mock' ? MOCK_GATEWAY_URLS.wsUrl : settings.localWsUrl,
    requestTimeoutMs: 8_000,
  };
};

export const getGatewayRuntimeConfig = (): GatewayRuntimeConfig => runtimeConfig;
