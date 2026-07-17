/**
 * GuardrNotification — Base Web Notification/Banner wrapper.
 * https://baseweb.design/components/notification/
 *
 * Uber pattern: full-width contextual notice (info/warning/error).
 */

import React from 'react';
import { Notification as BaseNotification, KIND } from 'baseui/notification';
import { useStyletron } from 'baseui';

export type GuardrNotificationKind = 'info' | 'positive' | 'warning' | 'negative';

const KIND_MAP: Record<GuardrNotificationKind, (typeof KIND)[keyof typeof KIND]> = {
  info:     KIND.info,
  positive: KIND.positive,
  warning:  KIND.warning,
  negative: KIND.negative,
};

interface GuardrNotificationProps {
  kind?: GuardrNotificationKind;
  children: React.ReactNode;
  closeable?: boolean;
  onClose?: () => void;
}

export function GuardrNotification({
  kind = 'info',
  children,
  closeable = false,
  onClose,
}: GuardrNotificationProps) {
  const [, theme] = useStyletron();

  const bgColors: Record<GuardrNotificationKind, string> = {
    info:     theme.colors.backgroundSecondary,
    positive: `color-mix(in srgb, ${theme.colors.positive} 10%, ${theme.colors.backgroundPrimary})`,
    warning:  `color-mix(in srgb, ${theme.colors.warning} 12%, ${theme.colors.backgroundPrimary})`,
    negative: `color-mix(in srgb, ${theme.colors.negative} 8%, ${theme.colors.backgroundPrimary})`,
  };

  const textColors: Record<GuardrNotificationKind, string> = {
    info:     theme.colors.contentPrimary,
    positive: theme.colors.positive,
    warning:  theme.colors.warning,
    negative: theme.colors.negative,
  };

  return (
    <BaseNotification
      kind={KIND_MAP[kind]}
      closeable={closeable}
      onClose={onClose}
      overrides={{
        Body: {
          style: {
            width: '100%',
            borderRadius: '10px',
            backgroundColor: bgColors[kind],
            border: `1px solid ${theme.colors.borderOpaque}`,
            padding: '14px 16px',
            boxShadow: 'none',
            margin: 0,
          },
        },
        InnerContainer: {
          style: {
            fontSize: '14px',
            fontWeight: 500,
            color: textColors[kind],
            lineHeight: 1.5,
          },
        },
        CloseIcon: {
          style: {
            color: theme.colors.contentSecondary,
            width: '18px',
            height: '18px',
          },
        },
      }}
    >
      {() => children}
    </BaseNotification>
  );
}
