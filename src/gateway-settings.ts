import { z } from 'zod';

const gatewayUrl = (protocols: readonly string[], pathname: string) =>
  z
    .string()
    .trim()
    .url()
    .refine((value) => {
      const url = new URL(value);
      return (
        protocols.includes(url.protocol) &&
        url.pathname.replace(/\/$/, '') === pathname &&
        url.username === '' &&
        url.password === '' &&
        url.search === '' &&
        url.hash === ''
      );
    });

export const gatewaySettingsSchema = z
  .object({
    mode: z.enum(['mock', 'local']),
    localApiBaseUrl: gatewayUrl(['http:', 'https:'], '/api/v1'),
    localWsUrl: gatewayUrl(['ws:', 'wss:'], '/ws'),
  })
  .strict();

export type GatewaySettings = z.infer<typeof gatewaySettingsSchema>;

export const DEFAULT_GATEWAY_SETTINGS: GatewaySettings = {
  mode: 'mock',
  localApiBaseUrl: 'http://localhost/api/v1',
  localWsUrl: 'ws://localhost/ws',
};

export const MOCK_GATEWAY_URLS = {
  apiBaseUrl: 'https://plkit-gateway-simulator.onrender.com/api/v1',
  wsUrl: 'wss://plkit-gateway-simulator.onrender.com/ws',
} as const;
