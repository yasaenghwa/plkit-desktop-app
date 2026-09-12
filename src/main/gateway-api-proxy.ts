import { z } from 'zod';

const gatewayProxyConfigSchema = z.object({
  apiBaseUrl: z.string().url(),
  requestTimeoutMs: z.coerce.number().int().positive().default(8_000),
});

const gatewayProxyRequestSchema = z.object({
  body: z.string().optional(),
  method: z.enum(['GET', 'PATCH', 'POST']),
  path: z.string().min(1),
});

type GatewayProxyConfigInput = {
  readonly apiBaseUrl: unknown;
  readonly requestTimeoutMs: unknown;
};

export type GatewayProxyResponse = {
  readonly body: string | null;
  readonly contentType: string | null;
  readonly status: number;
};

const resolveGatewayUrl = (apiBaseUrl: string, path: string): URL => {
  const base = new URL(`${apiBaseUrl.replace(/\/$/, '')}/`);
  const url = new URL(path, base);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
    throw new TypeError('Gateway request path is outside the configured API base URL.');
  }
  return url;
};

export const createGatewayRequestHandler = (
  input: GatewayProxyConfigInput,
  fetcher: typeof fetch = globalThis.fetch,
): ((request: unknown) => Promise<GatewayProxyResponse>) => {
  const config = gatewayProxyConfigSchema.parse(input);

  return async (requestInput: unknown): Promise<GatewayProxyResponse> => {
    const request = gatewayProxyRequestSchema.parse(requestInput);
    const response = await fetcher(resolveGatewayUrl(config.apiBaseUrl, request.path), {
      method: request.method,
      signal: AbortSignal.timeout(config.requestTimeoutMs),
      ...(request.body === undefined
        ? {}
        : { body: request.body, headers: { 'content-type': 'application/json' } }),
    });

    return {
      body: response.status === 204 ? null : await response.text(),
      contentType: response.headers.get('content-type'),
      status: response.status,
    };
  };
};
