/**
 * Base Web (Base Web) provider — wraps the entire Guardr app.
 *
 * Uses styletron-engine-atomic for client rendering (recommended by Base Web
 * docs: https://baseweb.design/getting-started/setup/).
 * Falls back to styletron-engine-monolithic (Server) for SSR contexts.
 */

import React, { useMemo } from 'react';
import { Client as StyletronAtomic } from 'styletron-engine-atomic';
import { Server as StyletronServer } from 'styletron-engine-monolithic';
import { Provider as StyletronProvider } from 'styletron-react';
import { BaseProvider } from 'baseui';
import { useThemeMode } from '../../lib/platform/useThemeMode';
import { guardrThemeForMode } from '../../theme/guardrBaseTheme';
import { UberThemeVars } from './dashboard/themeVars';
import { withAppBreakpoints } from './layout/shellStyles';

// Singleton atomic engine — created once, reused across re-renders
let atomicEngine: StyletronAtomic | null = null;

function getStyletronEngine(): StyletronAtomic | StyletronServer {
  if (typeof window === 'undefined') {
    // SSR: new server instance per request
    return new StyletronServer();
  }
  if (!atomicEngine) {
    atomicEngine = new StyletronAtomic();
  }
  return atomicEngine;
}

/**
 * Guardr Base Web provider.
 *
 * Stack (per https://baseweb.design/getting-started/setup/):
 *   StyletronProvider (atomic engine)
 *   └─ BaseProvider (Guardr theme — black/white on LightTheme/DarkTheme)
 *      └─ UberThemeVars (sync tokens → CSS custom properties)
 *         └─ {children}
 */
export function BaseUIProvider({ children }: { children: React.ReactNode }) {
  const mode   = useThemeMode();
  const engine = useMemo(() => getStyletronEngine(), []);
  const theme  = useMemo(() => withAppBreakpoints(guardrThemeForMode(mode)), [mode]);

  return (
    <StyletronProvider value={engine}>
      <BaseProvider theme={theme}>
        <UberThemeVars />
        {children}
      </BaseProvider>
    </StyletronProvider>
  );
}
