import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { RotateGate, lockOrientation } from './ui/components/RotateGate';
import { UpdateBanner, registerServiceWorker } from './ui/pwa';
import './ui/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <RotateGate />
    <UpdateBanner />
  </StrictMode>,
);

lockOrientation();
registerServiceWorker();
