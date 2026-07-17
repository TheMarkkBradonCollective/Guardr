import React from 'react';
import { Tag as BaseTag } from './baseuiShims';

export type GuardrTagKind = 'accent' | 'neutral' | 'success' | 'warning' | 'danger';

const KIND_MAP: Record<GuardrTagKind, string> = {
  accent: 'accent',
  neutral: 'neutral',
  success: 'positive',
  warning: 'warning',
  danger: 'negative',
};

export function GuardrTag({
  children,
  kind = 'neutral',
  closeable = false,
  onActionClick,
  overrides,
}: {
  children: React.ReactNode;
  kind?: GuardrTagKind;
  closeable?: boolean;
  onActionClick?: () => void;
  overrides?: Record<string, unknown>;
}) {
  return (
    <BaseTag
      closeable={closeable}
      onActionClick={onActionClick}
      kind={KIND_MAP[kind]}
      overrides={{
        Root: {
          style: {
            borderRadius: '9999px',
            fontWeight: 600,
            fontSize: '12px',
          },
        },
        ...overrides,
      }}
    >
      {children}
    </BaseTag>
  );
}
