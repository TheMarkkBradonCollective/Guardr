import React from 'react';
import { WfSectionHeader } from '../ui/wireframe';

interface StaffAccountAccessSectionProps {
  title?: string;
  badge?: React.ReactNode;
  leading?: React.ReactNode;
  /** Extra class for the leading action row. Default is full-width primary. */
  leadingClassName?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Profile action block used on guard, staff, client, and application details.
 * `leading` is the full-width primary CTA (Edit profile / View full profile).
 * `children` are the colorful account-access actions.
 */
export function StaffAccountAccessSection({
  title = 'Account access',
  badge,
  leading,
  leadingClassName,
  children,
  className = '',
}: StaffAccountAccessSectionProps) {
  if (!leading && !children) return null;

  return (
    <section className={`staff-detail-section staff-account-access space-y-3 ${className}`.trim()}>
      {leading ? (
        <div
          className={`staff-detail-actions ${leadingClassName ?? 'staff-detail-actions--primary'}`.trim()}
        >
          {leading}
        </div>
      ) : null}
      {(badge || children) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <WfSectionHeader title={title} className="!px-0 !mb-0" />
          {badge}
        </div>
      )}
      {children ? <div className="staff-detail-actions">{children}</div> : null}
    </section>
  );
}
