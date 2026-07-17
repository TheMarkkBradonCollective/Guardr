import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Client as Styletron } from 'styletron-engine-monolithic';
import { Provider as StyletronProvider } from 'styletron-react';
import { BaseProvider } from 'baseui';
import { DesignPreviewApp } from './DesignPreviewApp';
import { darkTheme } from './theme';

const engine = new Styletron();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StyletronProvider value={engine}>
      <BaseProvider theme={darkTheme}>
        <DesignPreviewApp />
      </BaseProvider>
    </StyletronProvider>
  </StrictMode>,
);
