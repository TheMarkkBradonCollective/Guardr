import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { DeviceProvider } from './lib/platform';
import { applyThemeToDocument, loadTheme } from './lib/platform/theme';
import './index.css';

applyThemeToDocument(loadTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DeviceProvider>
      <App />
    </DeviceProvider>
  </StrictMode>,
);
