import { contextBridge, ipcRenderer } from 'electron';

const GATEWAY_HTTP_CHANNEL = 'gateway:http-request';

type GatewayHttpRequest = {
  readonly body?: string;
  readonly method: 'GET' | 'PATCH' | 'POST';
  readonly path: string;
};

type GatewayHttpResponse = {
  readonly body: string | null;
  readonly contentType: string | null;
  readonly status: number;
};

type GatewayHttpBridge = {
  readonly request: (request: GatewayHttpRequest) => Promise<GatewayHttpResponse>;
};

const gatewayHttp: GatewayHttpBridge = {
  request: async (request) => ipcRenderer.invoke(GATEWAY_HTTP_CHANNEL, request),
};

contextBridge.exposeInMainWorld('gatewayHttp', gatewayHttp);

declare global {
  interface Window {
    readonly gatewayHttp: GatewayHttpBridge;
  }
}
