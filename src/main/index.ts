import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';

import { createGatewayRequestHandler } from './gateway-api-proxy';

const GATEWAY_HTTP_CHANNEL = 'gateway:http-request';

const requestGateway = createGatewayRequestHandler({
  apiBaseUrl: import.meta.env['VITE_GATEWAY_API_BASE_URL'],
  requestTimeoutMs: import.meta.env['VITE_GATEWAY_REQUEST_TIMEOUT_MS'],
});

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 1512,
    height: 960,
    useContentSize: true,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const rendererUrl = process.env['ELECTRON_RENDERER_URL'];
  if (rendererUrl) {
    void mainWindow.loadURL(rendererUrl);
    return;
  }

  void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
};

app.whenReady().then(() => {
  ipcMain.handle(GATEWAY_HTTP_CHANNEL, (_event, request: unknown) => requestGateway(request));
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
