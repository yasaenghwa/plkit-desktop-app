import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

const rendererPath = (path: string): string =>
  fileURLToPath(new URL(`./src/renderer/${path}`, import.meta.url));

export default defineConfig({
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
  test: {
    environment: 'node',
  },
});
