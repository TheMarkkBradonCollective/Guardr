import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BaseUIProvider } from '../components/baseui';
import { AppMotionProvider } from '../components/ui/motion/AppMotion';
import { AppSnackbarProvider } from '../components/ui/AppToast';
import { AppConfirmHost } from '../components/ui/AppConfirm';
import { DeviceProvider } from '../lib/platform';
import { applyThemeToDocument, loadTheme } from '../lib/platform/theme';
import { DesignPreviewApp } from './DesignPreviewApp';
import '../index.css';
import '../styles/uber-surfaces.css';
import '../styles/uber-mobility.css';
import '../styles/uber-landing.css';

applyThemeToDocument(loadTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DeviceProvider>
      <BaseUIProvider>
        <AppMotionProvider>
          <AppSnackbarProvider>
            <DesignPreviewApp />
            <AppConfirmHost />
          </AppSnackbarProvider>
        </AppMotionProvider>
      </BaseUIProvider>
    </DeviceProvider>
  </StrictMode>,
);
