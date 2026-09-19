import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { loadGatewaySettings, saveGatewaySettings } from './gateway-settings-store';

const settingsPath = (): string => join(app.getPath('userData'), 'plkit', 'gateway-settings.json');
const rendererUrl = process.env['ELECTRON_RENDERER_URL'];
const expectedRendererUrl = rendererUrl
  ? new URL(rendererUrl).href
  : pathToFileURL(join(__dirname, '../renderer/index.html')).href;

const isAppWindow = (event: Electron.IpcMainInvokeEvent): boolean => {
  const window = BrowserWindow.fromWebContents(event.sender);
  return (
    window !== null &&
    event.senderFrame === window.webContents.mainFrame &&
    event.senderFrame.url === expectedRendererUrl
  );
};

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 1512,
    height: 960,
    useContentSize: true,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    fullscreen: true,
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

  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('window:full-screen-changed', true);
  });
  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('window:full-screen-changed', false);
  });

  if (rendererUrl) {
    void mainWindow.loadURL(rendererUrl);
    return;
  }

  void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
};

app.whenReady().then(() => {
  ipcMain.handle('gateway-settings:load', (event) => {
    if (!isAppWindow(event)) {
      throw new Error('Gateway settings are available only to the app window.');
    }
    return loadGatewaySettings(settingsPath());
  });
  ipcMain.handle('gateway-settings:save', (event, value: unknown) => {
    if (!isAppWindow(event)) {
      throw new Error('Gateway settings are available only to the app window.');
    }
    return saveGatewaySettings(settingsPath(), value);
  });
  ipcMain.on('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });
  ipcMain.on('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });
  ipcMain.on('window:toggle-full-screen', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) window.setFullScreen(!window.isFullScreen());
  });
  ipcMain.handle(
    'window:is-full-screen',
    (event) => BrowserWindow.fromWebContents(event.sender)?.isFullScreen() ?? false,
  );

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
