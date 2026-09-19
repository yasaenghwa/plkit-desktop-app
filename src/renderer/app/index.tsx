import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { initializeGatewayRuntime } from '@shared/config';

import '@app/styles/global.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Renderer root element is missing.');
}

const root = createRoot(rootElement);

const start = async (): Promise<void> => {
  try {
    const settings = await window.gatewaySettings.load();
    initializeGatewayRuntime(settings);
    const { DashboardPage } = await import('@pages/dashboard');
    root.render(
      <StrictMode>
        <DashboardPage settings={settings} />
      </StrictMode>,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    root.render(<p role="alert">Gateway 설정을 불러오지 못했습니다: {message}</p>);
  }
};

void start();
