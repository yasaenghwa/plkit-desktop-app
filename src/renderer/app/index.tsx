import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { DashboardPage } from '@pages/dashboard';

import '@app/styles/global.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Renderer root element is missing.');
}

createRoot(rootElement).render(
  <StrictMode>
    <DashboardPage />
  </StrictMode>,
);
