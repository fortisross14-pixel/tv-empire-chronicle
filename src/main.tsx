import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { RotateGate, lockOrientation } from './ui/components/RotateGate';
import { UpdateBanner, registerServiceWorker } from './ui/pwa';
import { initStorage } from './engine/storage';
import './ui/styles.css';

// The backup save store is read first, so saves kept there show up on the title screen.
void initStorage().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
      <RotateGate />
      <UpdateBanner />
    </StrictMode>,
  );
});

lockOrientation();
registerServiceWorker();
