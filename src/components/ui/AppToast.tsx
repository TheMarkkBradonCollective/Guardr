import React, { useEffect } from 'react';
import { useStyletron } from 'baseui';
import { SnackbarProvider, PLACEMENT, useSnackbar } from 'baseui/snackbar';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Block } from 'baseui/block';
import { ParagraphMedium, LabelSmall } from 'baseui/typography';
import { snackbarOverrides } from '../baseui/overlays/overlayStyles';
import { dequeueSnackbar, enqueueSnackbar, registerSnackbarHandlers } from '../baseui/overlays/snackbarBridge';

export type AppToastTone = 'success' | 'error' | 'info';

const TOAST_ENHANCERS: Record<AppToastTone, React.ComponentType<{ size: number }>> = {
  success: ({ size }) => <CheckCircle size={size} color="var(--status-success)" strokeWidth={2} />,
  error: ({ size }) => <AlertCircle size={size} color="var(--status-danger)" strokeWidth={2} />,
  info: function InfoEnhancer({ size }) {
    const [, theme] = useStyletron();
    return <Info size={size} color={theme.colors.accent} strokeWidth={2} />;
  },
};

export interface AppToastMessage {
  id: number;
  title: string;
  body?: string;
  tone: AppToastTone;
}

export function showAppToast(
  title: string,
  options?: { body?: string; tone?: AppToastTone; durationMs?: number },
) {
  const tone = options?.tone ?? 'info';
  enqueueSnackbar(
    {
      message: (
        <Block>
          <ParagraphMedium $style={{ fontWeight: 600, margin: 0, lineHeight: '20px' }}>{title}</ParagraphMedium>
          {options?.body ? (
            <LabelSmall
              $style={{
                marginTop: '4px',
                color: 'var(--uber-text-muted, #6b6b6b)',
                display: 'block',
              }}
            >
              {options.body}
            </LabelSmall>
          ) : null}
        </Block>
      ),
      startEnhancer: TOAST_ENHANCERS[tone] as never,
    },
    options?.durationMs ?? 5200,
  );
}

export function dismissAppToast() {
  dequeueSnackbar();
}

function SnackbarRegistrar() {
  const { enqueue, dequeue } = useSnackbar();

  useEffect(() => {
    registerSnackbarHandlers(enqueue, dequeue);
    return () => registerSnackbarHandlers(null, null);
  }, [enqueue, dequeue]);

  return null;
}

/** Wraps app content with Base Web SnackbarProvider + imperative toast bridge. */
export function AppSnackbarProvider({ children }: { children: React.ReactNode }) {
  return (
    <SnackbarProvider placement={PLACEMENT.top} defaultDuration={5200} overrides={snackbarOverrides}>
      {children}
      <SnackbarRegistrar />
    </SnackbarProvider>
  );
}

/** @deprecated Use AppSnackbarProvider in main.tsx — kept for import compatibility */
export function AppToastHost() {
  return <SnackbarRegistrar />;
}

// Legacy subscription API — no-op stubs for any external listeners
type Listener = (toast: AppToastMessage | null) => void;

export function subscribeAppToast(_listener: Listener): () => void {
  return () => undefined;
}
