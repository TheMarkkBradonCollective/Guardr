import React from 'react';

export type WfBadgeTone = 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'danger';

interface WfBadgeProps {
  children: React.ReactNode;
  tone?: WfBadgeTone;
  className?: string;
}

const TONE_CLASS: Record<WfBadgeTone, string> = {
  default: 'wf-badge',
  muted: 'wf-badge',
  primary: 'wf-badge wf-badge-primary',
  success: 'wf-badge wf-badge-success',
  warning: 'wf-badge wf-badge-warning',
  danger: 'wf-badge wf-badge-danger',
};

export function WfBadge({ children, tone = 'default', className = '' }: WfBadgeProps) {
  return <span className={`${TONE_CLASS[tone]} ${className}`}>{children}</span>;
}
