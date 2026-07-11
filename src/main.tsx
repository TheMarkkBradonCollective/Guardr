import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ensureNativePermissions } from './lib/platform/nativePermissions';
import { registerNativeInstall, registerPwaInstall } from './lib/platform/installRegistry';
import App from './App.tsx';
import { AppMotionProvider } from './components/ui/motion/AppMotion';
import { AppToastHost } from './components/ui/AppToast';
import { AppConfirmHost } from './components/ui/AppConfirm';
import { DeviceProvider } from './lib/platform';
import { applyThemeToDocument, loadTheme } from './lib/platform/theme';
import { registerServiceWorker } from './lib/push';
import { initSentry } from './lib/sentry';
import './index.css';

applyThemeToDocument(loadTheme());

void initSentry();

async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#5E7B61' });
  } catch (error) {
    console.warn('[native] status bar setup failed:', error);
  }
  await ensureNativePermissions();
  await registerNativeInstall();
  registerPwaInstall(import.meta.env.VITE_APP_VERSION || '1.0.0');
}

void initNativeShell();

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
