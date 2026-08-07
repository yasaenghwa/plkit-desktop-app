import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

delete process.env['ELECTRON_RUN_AS_NODE'];

const rendererPath = (path: string): string =>
  fileURLToPath(new URL(`./src/renderer/${path}`, import.meta.url));

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    plugins: [react()],
    resolve: {
      alias: {
        '@app': rendererPath('app'),
        '@pages': rendererPath('pages'),
        '@widgets': rendererPath('widgets'),
        '@features': rendererPath('features'),
        '@entities': rendererPath('entities'),
        '@shared': rendererPath('shared'),
      },
    },
  },
});
