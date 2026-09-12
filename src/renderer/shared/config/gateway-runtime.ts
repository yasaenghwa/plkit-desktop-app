import { z } from 'zod';

const gatewayEnvironmentSchema = z
  .object({
    VITE_GATEWAY_API_BASE_URL: z.string().url(),
    VITE_GATEWAY_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(8_000),
    VITE_GATEWAY_WS_URL: z.string().url(),
  })
  .readonly();

const environment = gatewayEnvironmentSchema.parse(import.meta.env);

export type GatewayRuntimeConfig = {
  readonly apiBaseUrl: string;
  readonly requestTimeoutMs: number;
  readonly wsUrl: string;
};

export const GATEWAY_RUNTIME_CONFIG: GatewayRuntimeConfig = {
  apiBaseUrl: environment.VITE_GATEWAY_API_BASE_URL.replace(/\/$/, ''),
  requestTimeoutMs: environment.VITE_GATEWAY_REQUEST_TIMEOUT_MS,
  wsUrl: environment.VITE_GATEWAY_WS_URL,
};
