import React from 'react';
import { WfSectionHeader } from '../ui/wireframe';

interface StaffAccountAccessSectionProps {
  title?: string;
  badge?: React.ReactNode;
  /** Primary commit CTA pinned to the bottom of the block (Approve, Restore, Save). */
  leading?: React.ReactNode;
  /** Extra class for the footer CTA row. Default is full-width primary. */
  leadingClassName?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Profile action block used on guard, staff, client, and application details.
 * Secondary actions render as a stacked option list; `leading` is the full-width
 * black footer CTA (Approve / Restore / Save).
 */
export function StaffAccountAccessSection({
  title = 'Account access',
  badge,
  leading,
  leadingClassName,
  children,
  className = '',
}: StaffAccountAccessSectionProps) {
  const hasChildren = React.Children.toArray(children).some(Boolean);
  if (!leading && !hasChildren) return null;

  return (
    <section className={`staff-detail-section staff-account-access space-y-3 ${className}`.trim()}>
      {hasChildren && (
        <>
          <div className="staff-account-access-head">
            <WfSectionHeader title={title} className="!px-0 !mb-0" />
            {badge}
          </div>
          <div className="staff-detail-actions staff-detail-actions--list">{children}</div>
        </>
      )}
      {leading ? (
        <div
          className={`staff-detail-actions ${leadingClassName ?? 'staff-detail-actions--primary'}`.trim()}
        >
          {leading}
        </div>
      ) : null}
    </section>
  );
}
