/**
 * GuardrBadge — Base Web Badge + Notification count wrapper.
 * https://baseweb.design/components/badge/
 *
 * Base Web pattern: small black counter badge on icons/avatars.
 */

import React from 'react';
import { Badge as BaseBadge, SHAPE, COLOR } from 'baseui/badge';
import { useStyletron } from 'baseui';
import { FONT_TEXT } from '../../theme/typography';

interface GuardrBadgeProps {
  count: number;
  children: React.ReactNode;
  max?: number;
  hidden?: boolean;
}

/** Wraps a child element with a notification count badge (notification bell style). */
export function GuardrBadge({
  count,
  children,
  max = 99,
  hidden = false,
}: GuardrBadgeProps) {
  const [, theme] = useStyletron();

  if (hidden || count === 0) {
    return <>{children}</>;
  }

  const label = count > max ? `${max}+` : String(count);

  return (
    <BaseBadge
      content={label}
      shape={SHAPE.pill}
      color={COLOR.negative}
      overrides={{
        Badge: {
          style: {
            fontFamily: FONT_TEXT,
            fontWeight: 700,
            fontSize: '10px',
            minWidth: '16px',
            height: '16px',
            padding: '0 4px',
            borderRadius: '999px',
            backgroundColor: theme.colors.negative,
            color: '#fff',
            lineHeight: '16px',
            textAlign: 'center',
          },
        },
      }}
    >
      {children}
    </BaseBadge>
  );
}

/** Inline status dot badge (like Base Web live indicator) */
export function GuardrStatusDot({
  status,
  size = 8,
}: {
  status: 'active' | 'inactive' | 'warning' | 'danger';
  size?: number;
}) {
  const [, theme] = useStyletron();
  const COLOR_MAP = {
    active:   theme.colors.positive,
    inactive: theme.colors.contentSecondary,
    warning:  theme.colors.warning,
    danger:   theme.colors.negative,
  };

  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: COLOR_MAP[status],
        flexShrink: 0,
        ...(status === 'active' ? {
          animation: 'uber-pulse 2s ease-in-out infinite',
        } : {}),
      }}
      aria-hidden
    />
  );
}
