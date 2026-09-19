import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

import type { GatewaySettings } from '../gateway-settings';

type WindowControls = {
  readonly close: () => void;
  readonly minimize: () => void;
  readonly toggleFullScreen: () => void;
  readonly isFullScreen: () => Promise<boolean>;
  readonly onFullScreenChange: (callback: (isFullScreen: boolean) => void) => () => void;
};

type GatewaySettingsBridge = {
  readonly load: () => Promise<GatewaySettings>;
  readonly save: (settings: GatewaySettings) => Promise<GatewaySettings>;
};

declare global {
  interface Window {
    readonly windowControls: WindowControls;
    readonly gatewaySettings: GatewaySettingsBridge;
  }
}

const windowControls: WindowControls = {
  close: () => ipcRenderer.send('window:close'),
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleFullScreen: () => ipcRenderer.send('window:toggle-full-screen'),
  isFullScreen: () => ipcRenderer.invoke('window:is-full-screen'),
  onFullScreenChange: (callback) => {
    const listener = (_event: IpcRendererEvent, isFullScreen: boolean): void => {
      callback(isFullScreen);
    };
    ipcRenderer.on('window:full-screen-changed', listener);
    return () => ipcRenderer.removeListener('window:full-screen-changed', listener);
  },
};

contextBridge.exposeInMainWorld('windowControls', windowControls);
contextBridge.exposeInMainWorld('gatewaySettings', {
  load: () => ipcRenderer.invoke('gateway-settings:load'),
  save: (settings: GatewaySettings) => ipcRenderer.invoke('gateway-settings:save', settings),
} satisfies GatewaySettingsBridge);
