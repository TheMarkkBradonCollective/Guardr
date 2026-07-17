import React, { useMemo } from 'react';
import { Client as Styletron, Server as StyletronServer } from 'styletron-engine-monolithic';
import { Provider as StyletronProvider } from 'styletron-react';
import { BaseProvider } from 'baseui';
import { useThemeMode } from '../../lib/platform/useThemeMode';
import { uberThemeForMode } from '../../theme/uberBaseTheme';
import { UberThemeVars } from './dashboard/themeVars';
import { withAppBreakpoints } from './layout/shellStyles';

let clientEngine: Styletron | null = null;

function getStyletronEngine(): Styletron | StyletronServer {
  if (typeof window === 'undefined') {
    return new StyletronServer();
  }
  if (!clientEngine) {
    clientEngine = new Styletron();
  }
  return clientEngine;
}

export function BaseUIProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeMode();
  const engine = useMemo(() => getStyletronEngine(), []);
  const theme = useMemo(() => withAppBreakpoints(uberThemeForMode(mode)), [mode]);

  return (
    <StyletronProvider value={engine}>
      <BaseProvider theme={theme}>
        <UberThemeVars />
        {children}
      </BaseProvider>
    </StyletronProvider>
  );
}
