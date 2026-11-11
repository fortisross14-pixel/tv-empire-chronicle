import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { RotateGate, lockOrientation } from './ui/components/RotateGate';
import './ui/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <RotateGate />
  </StrictMode>,
);

lockOrientation();
