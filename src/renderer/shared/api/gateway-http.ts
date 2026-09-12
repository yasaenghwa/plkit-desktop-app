import ky, { HTTPError, type KyInstance } from 'ky';
import { z } from 'zod';

import { GatewayProblemError, problemDetailsSchema } from './problem-details';

type GatewayHttpMethod = 'GET' | 'PATCH' | 'POST';

type RequestOptions = {
  readonly body?: unknown;
  readonly method?: 'get' | 'patch' | 'post';
  readonly searchParams?: URLSearchParams;
  readonly signal?: AbortSignal | undefined;
};

const toGatewayMethod = (method: string): GatewayHttpMethod => {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'GET';
    case 'PATCH':
      return 'PATCH';
    case 'POST':
      return 'POST';
    default:
      throw new TypeError(`Unsupported Gateway HTTP method: ${method}`);
  }
};

const invokeWithAbort = async <Output>(
  request: Promise<Output>,
  signal: AbortSignal,
): Promise<Output> => {
  if (signal.aborted) throw new DOMException('The operation was aborted.', 'AbortError');

  return new Promise((resolve, reject) => {
    const abort = (): void => reject(new DOMException('The operation was aborted.', 'AbortError'));
    const settle = (callback: () => void): void => {
      signal.removeEventListener('abort', abort);
      callback();
    };

    signal.addEventListener('abort', abort, { once: true });
    void request.then(
      (value) => settle(() => resolve(value)),
      (error: unknown) => settle(() => reject(error)),
    );
  });
};

const createGatewayBridgeFetch = (baseUrl: string): typeof fetch => {
  const base = new URL(`${baseUrl.replace(/\/$/, '')}/`);

  return async (input, init): Promise<Response> => {
    const request = new Request(input, init);
    const requestUrl = new URL(request.url);
    if (requestUrl.origin !== base.origin || !requestUrl.pathname.startsWith(base.pathname)) {
      throw new TypeError('Gateway request URL is outside the configured API base URL.');
    }

    const method = toGatewayMethod(request.method);
    const body = method === 'GET' ? undefined : await request.text();
    const path = `${requestUrl.pathname.slice(base.pathname.length)}${requestUrl.search}`;
    const bridgeRequest = window.gatewayHttp.request({
      method,
      path,
      ...(body === undefined ? {} : { body }),
    });
    const response = await invokeWithAbort(bridgeRequest, request.signal);
    return new Response(response.body, {
      status: response.status,
      ...(response.contentType ? { headers: { 'content-type': response.contentType } } : {}),
    });
  };
};

const resolveGatewayFetch = (baseUrl: string): typeof fetch => {
  if (typeof window === 'undefined') return globalThis.fetch;
  if (!window.gatewayHttp) throw new Error('Electron Gateway HTTP bridge is unavailable.');
  return createGatewayBridgeFetch(baseUrl);
};

const parseProblem = async (error: HTTPError): Promise<GatewayProblemError | HTTPError> => {
  const contentType = error.response.headers.get('content-type');
  if (!contentType?.toLowerCase().includes('application/problem+json')) return error;

  let payload: unknown;
  try {
    payload = await error.response.clone().json();
  } catch (parseError) {
    if (parseError instanceof SyntaxError) return error;
    throw parseError;
  }
  const parsed = problemDetailsSchema.safeParse(payload);
  return parsed.success ? new GatewayProblemError(parsed.data) : error;
};

export type GatewayHttpClient = {
  readonly request: <Output>(
    path: string,
    schema: z.ZodType<Output>,
    options?: RequestOptions,
  ) => Promise<Output>;
};

export const createGatewayHttpClient = (baseUrl: string, timeoutMs: number): GatewayHttpClient => {
  const client: KyInstance = ky.create({
    fetch: resolveGatewayFetch(baseUrl),
    prefixUrl: baseUrl,
    retry: { limit: 1, methods: ['get'] },
    timeout: timeoutMs,
  });

  return {
    request: async <Output>(
      path: string,
      schema: z.ZodType<Output>,
      options: RequestOptions = {},
    ): Promise<Output> => {
      try {
        const requestOptions = {
          method: options.method ?? 'get',
          ...(options.body === undefined ? {} : { json: options.body }),
          ...(options.searchParams === undefined ? {} : { searchParams: options.searchParams }),
          ...(options.signal === undefined ? {} : { signal: options.signal }),
        };
        const response = await client(path, requestOptions);
        const payload: unknown = response.status === 204 ? undefined : await response.json();
        return schema.parse(payload);
      } catch (error) {
        if (error instanceof HTTPError) {
          throw await parseProblem(error);
        }
        throw error;
      }
    },
  };
};
