import React from 'react';

/** Flat section block for Management / Platform pages (matches Operations page rhythm). */
export function StaffMgmtSection({
  title,
  children,
  className = '',
  fullWidth = false,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  /** Span full grid width on wide desktop layouts. */
  fullWidth?: boolean;
}) {
  return (
    <section
      className={`staff-mgmt-section${fullWidth ? ' staff-mgmt-section--full' : ''} ${className}`.trim()}
    >
      <h3 className="staff-mgmt-section-title">{title}</h3>
      <div className="staff-mgmt-section-body">{children}</div>
    </section>
  );
}
