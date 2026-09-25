import ky, { HTTPError, type KyInstance } from 'ky';
import { z } from 'zod';

import { GatewayProblemError, problemDetailsSchema } from './problem-details';

type RequestOptions = {
  readonly body?: unknown;
  /** Sent instead of application/json, e.g. application/merge-patch+json for PATCH /devices/{id}/meta. */
  readonly contentType?: string;
  readonly method?: 'get' | 'patch' | 'post';
  readonly searchParams?: URLSearchParams;
  readonly signal?: AbortSignal | undefined;
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
          ...(options.body === undefined
            ? {}
            : options.contentType === undefined
              ? { json: options.body }
              : {
                  body: JSON.stringify(options.body),
                  headers: { 'content-type': options.contentType },
                }),
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
