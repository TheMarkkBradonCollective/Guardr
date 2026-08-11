import React from 'react';
import { useStyletron } from 'baseui';
import { FONT_DISPLAY } from '../../../theme/typography';

export function DashboardZone({
  title,
  actionLabel,
  onAction,
  children,
  className = '',
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [, theme] = useStyletron();

  return (
    <section className={`app-dashboard-zone ${className}`.trim()} aria-label={title}>
      {/* Guardr-style section header */}
      <div className="app-section-head">
        <h2 style={{
          fontFamily: FONT_DISPLAY,
          fontSize: '18px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: theme.colors.contentPrimary,
          margin: 0,
        }}>
          {title}
        </h2>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="app-section-link"
            style={{
              fontFamily: 'inherit',
              fontSize: '13px',
              fontWeight: 600,
              color: theme.colors.contentSecondary,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      <div className="app-dashboard-zone-body">{children}</div>
    </section>
  );
}
