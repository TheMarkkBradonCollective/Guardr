import React from 'react';
import { GuardrTag, type GuardrTagKind } from '../../baseui/GuardrTag';

export type WfBadgeTone = 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'danger';

interface WfBadgeProps {
  children: React.ReactNode;
  tone?: WfBadgeTone;
  className?: string;
}

const TONE_MAP: Record<WfBadgeTone, GuardrTagKind> = {
  default: 'neutral',
  muted: 'neutral',
  primary: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

export function WfBadge({ children, tone = 'default', className = '' }: WfBadgeProps) {
  return (
    <span className={className}>
      <GuardrTag kind={TONE_MAP[tone]} closeable={false}>
        {children}
      </GuardrTag>
    </span>
  );
}
