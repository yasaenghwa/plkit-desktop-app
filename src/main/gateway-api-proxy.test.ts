import { createServer, type Server } from 'node:http';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createGatewayRequestHandler } from './gateway-api-proxy';

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
  if (request.url !== '/api/v1/system/status') {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ gateway: 'NORMAL' }));
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

describe('Gateway API proxy', () => {
  it('relays a Gateway response without requiring a CORS header', async () => {
    const requestGateway = createGatewayRequestHandler({
      apiBaseUrl: `http://127.0.0.1:${serverPort}/api/v1`,
      requestTimeoutMs: 1_000,
    });

    const response = await requestGateway({ method: 'GET', path: 'system/status' });

    expect(response).toEqual({
      body: JSON.stringify({ gateway: 'NORMAL' }),
      contentType: 'application/json',
      status: 200,
    });
  });
});
