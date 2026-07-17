import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { ensureNativePermissions } from './lib/platform/nativePermissions';
import { initNativeSafeArea } from './lib/platform/nativeSafeArea';
import { registerNativeInstall, registerPwaInstall } from './lib/platform/installRegistry';
import App from './App.tsx';
import { OfflineBanner } from './components/OfflineBanner';
import { AppMotionProvider } from './components/ui/motion/AppMotion';
import { AppSnackbarProvider } from './components/ui/AppToast';
import { AppConfirmHost } from './components/ui/AppConfirm';
import { DeviceProvider } from './lib/platform';
import { BaseUIProvider } from './components/baseui';
import { applyThemeToDocument, loadTheme } from './lib/platform/theme';
import { registerServiceWorker, initNativePushListeners } from './lib/push';
import { initNativePushBridge, restoreNativePushIfEnabled } from './lib/nativePush';
import { initSentry } from './lib/sentry';
import './index.css';

applyThemeToDocument(loadTheme());

void initSentry();

async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  initNativeSafeArea();
  initNativePushBridge();
  await ensureNativePermissions();
  await restoreNativePushIfEnabled();
  await registerNativeInstall();
  initNativePushListeners();
}

void initNativeShell();

if (!Capacitor.isNativePlatform()) {
  registerPwaInstall(import.meta.env.VITE_APP_VERSION || '1.0.0');
  void registerServiceWorker().catch((error) => {
    console.warn('[pwa] service worker registration failed:', error);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DeviceProvider>
      <BaseUIProvider>
        <AppMotionProvider>
          <AppSnackbarProvider>
            <App />
            <OfflineBanner />
            <AppConfirmHost />
          </AppSnackbarProvider>
        </AppMotionProvider>
      </BaseUIProvider>
    </DeviceProvider>
  </StrictMode>,
);
