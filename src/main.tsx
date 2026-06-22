import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AppMotionProvider } from './components/ui/motion/AppMotion';
import { DeviceProvider } from './lib/platform';
import { applyThemeToDocument, loadTheme } from './lib/platform/theme';
import './index.css';

applyThemeToDocument(loadTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DeviceProvider>
      <AppMotionProvider>
        <App />
      </AppMotionProvider>
    </DeviceProvider>
  </StrictMode>,
);
