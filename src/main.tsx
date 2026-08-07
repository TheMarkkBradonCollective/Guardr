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
import { SurfaceProvider } from './surfaces/SurfaceProvider';
import { preloadSurface } from './surfaces/SurfaceAppShell';
import { currentSurfaceOverride, detectCoarsePointer, resolveSurfaceKind } from './surfaces/surfaceKind';
import { getShellKind } from './lib/platform/shellKind';
import { getViewportWidth } from './lib/platform/device';
import { BaseUIProvider } from './components/baseui';
import { applyThemeToDocument, loadTheme } from './lib/platform/theme';
import { registerServiceWorker, initNativePushListeners } from './lib/push';
import { initPwaAutoUpdate } from './lib/pwaAutoUpdate';
import { initNativePushBridge, restoreNativePushIfEnabled } from './lib/nativePush';
import { initSentry } from './lib/sentry';
import './index.css';
import './styles/uber-typography.css';
import './styles/guardr-design-tokens.css';
// Three independent surface layers. Each is scoped to body[data-surface="…"], so
// exactly one applies at a time — see docs/SURFACES.md.
import './styles/surface-foundation.css';
import './styles/surface-mobile.css';
import './styles/surface-tablet.css';
import './styles/surface-desktop.css';
import './styles/uber-tokens.css';
import './styles/uber-surfaces.css';
import './styles/uber-mobility.css';
import './styles/uber-direct-desktop.css';
import './styles/uber-landing.css';
import './styles/auth-role-choice.css';
import './styles/uber-global.css';
import './styles/uber-workbench.css';
import './styles/auth-mobile-sheet.css';
import './styles/staff-credential-review.css';
import './styles/staff-management-flat.css';
import './styles/uber-mobile-overview.css';
import './styles/platform-optimizations.css';
import './styles/uber-in-app.css';
import './styles/uber-data.css';
import './styles/uber-forms.css';
import './styles/uber-text-case.css';
import './styles/legal-accept.css';

applyThemeToDocument(loadTheme());

// Start fetching the surface chunk before React mounts so the shell is ready on
// the first render instead of flashing a skeleton.
preloadSurface(
  resolveSurfaceKind({
    viewportWidth: getViewportWidth(),
    shellKind: getShellKind(),
    touch: detectCoarsePointer(),
    override: currentSurfaceOverride(),
  }),
);

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
  void registerServiceWorker()
    .then((registration) => {
      initPwaAutoUpdate(registration);
    })
    .catch((error) => {
      console.warn('[pwa] service worker registration failed:', error);
      initPwaAutoUpdate();
    });
}

const root = createRoot(document.getElementById('root')!);

function renderApp(children: React.ReactNode) {
  root.render(
    <StrictMode>
      <DeviceProvider>
        <SurfaceProvider>
          <BaseUIProvider>
            <AppMotionProvider>
              <AppSnackbarProvider>
                {children}
                <OfflineBanner />
                <AppConfirmHost />
              </AppSnackbarProvider>
            </AppMotionProvider>
          </BaseUIProvider>
        </SurfaceProvider>
      </DeviceProvider>
    </StrictMode>,
  );
}

// Dev-only harness: `?ui-preview=1` renders all three surface applications with
// static data so each can be reviewed without a live session.
const wantsUiPreview =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('ui-preview');

if (wantsUiPreview) {
  void import('./dev/SurfacePreview').then(({ default: SurfacePreview }) => renderApp(<SurfacePreview />));
} else {
  renderApp(<App />);
}
