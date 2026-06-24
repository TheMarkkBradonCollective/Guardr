import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AppMotionProvider } from './components/ui/motion/AppMotion';
import { AppToastHost } from './components/ui/AppToast';
import { AppConfirmHost } from './components/ui/AppConfirm';
import { DeviceProvider } from './lib/platform';
import { applyThemeToDocument, loadTheme } from './lib/platform/theme';
import { registerServiceWorker } from './lib/push';
import './index.css';

applyThemeToDocument(loadTheme());

void registerServiceWorker().catch((error) => {
  console.warn('[pwa] service worker registration failed:', error);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DeviceProvider>
      <AppMotionProvider>
        <App />
        <AppToastHost />
        <AppConfirmHost />
      </AppMotionProvider>
    </DeviceProvider>
  </StrictMode>,
);
