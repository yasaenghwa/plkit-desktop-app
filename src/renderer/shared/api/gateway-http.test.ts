import { createServer, type Server } from 'node:http';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { createGatewayHttpClient } from './gateway-http';
import type { GatewayProblemError } from './problem-details';

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
  if (request.url === '/api/v1/no-content') {
    response.writeHead(204).end();
    return;
  }

  response.writeHead(503, { 'content-type': 'application/problem+json' }).end(
    JSON.stringify({
      type: 'https://plkit.dev/problems/gateway-unavailable',
      title: 'Gateway unavailable',
      status: 503,
      code: 'GATEWAY_UNAVAILABLE',
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

describe('Gateway HTTP client', () => {
  it('uses browser fetch directly so Renderer requests remain observable', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ gateway: 'NORMAL' }), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      }),
    );
    vi.stubGlobal('window', {});
    vi.stubGlobal('fetch', fetcher);
    const client = createGatewayHttpClient('http://127.0.0.1:1/api/v1', 100);

    const result = await client.request('system/status', z.object({ gateway: z.string() }));

    expect(result).toEqual({ gateway: 'NORMAL' });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('returns undefined without parsing JSON when the response is 204', async () => {
    const client = createGatewayHttpClient(`http://127.0.0.1:${serverPort}/api/v1`, 1_000);

    const result = await client.request('no-content', z.undefined());

    expect(result).toBeUndefined();
  });

  it('throws a typed error when the response is application/problem+json', async () => {
    const client = createGatewayHttpClient(`http://127.0.0.1:${serverPort}/api/v1`, 1_000);

    const request = client.request('problem', z.unknown());

    await expect(request).rejects.toMatchObject({
      message: 'Gateway unavailable',
      name: 'GatewayProblemError',
      problem: {
        code: 'GATEWAY_UNAVAILABLE',
        status: 503,
        title: 'Gateway unavailable',
      },
    } satisfies Partial<GatewayProblemError>);
  });
});
