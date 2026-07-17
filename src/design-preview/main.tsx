import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BaseUIProvider } from '../components/baseui';
import { applyThemeToDocument, loadTheme } from '../lib/platform/theme';
import { DesignPreviewApp } from './DesignPreviewApp';
import '../index.css';

applyThemeToDocument(loadTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BaseUIProvider>
      <DesignPreviewApp />
    </BaseUIProvider>
  </StrictMode>,
);
