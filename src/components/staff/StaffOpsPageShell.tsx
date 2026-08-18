import React from 'react';
import { useLayoutFormFactor } from '../../surfaces';

interface StaffOpsPageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  toolbar?: React.ReactNode;
}

/**
 * Operations page canvas.
 *
 * Each application owns this wrapper: desktop gets the dense workbench, tablet
 * gets a split-friendly touch canvas, and mobile keeps the stacked field shell.
 * Tablet must not reuse the phone class names — those pull in bottom-nav
 * offsets and single-column bleed that do not belong on a persistent rail.
 */
export function StaffOpsPageShell({
  children,
  toolbar,
  className = '',
  ...rest
}: StaffOpsPageShellProps) {
  const formFactor = useLayoutFormFactor();

  if (formFactor === 'desktop') {
    return (
      <div className={`sfd-ops-page uber-ops-page ${className}`.trim()} {...rest}>
        {toolbar ? <div className="sfd-ops-page-toolbar">{toolbar}</div> : null}
        <div className="sfd-ops-page-body uber-ops-page-body">{children}</div>
      </div>
    );
  }

  if (formFactor === 'tablet') {
    return (
      <div
        className={`staff-ops-tablet-shell animate-fade-in flex flex-col min-w-0 h-full min-h-0 ${className}`.trim()}
        {...rest}
      >
        {toolbar ? <div className="staff-ops-tablet-toolbar shrink-0">{toolbar}</div> : null}
        <div className="staff-ops-tablet-body min-w-0 min-h-0 flex-1 flex flex-col">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={`staff-ops-mobile-shell animate-fade-in flex flex-col min-w-0 ${className}`.trim()}
      {...rest}
    >
      {toolbar ? <div className="staff-ops-mobile-toolbar shrink-0">{toolbar}</div> : null}
      <div className="staff-ops-mobile-body min-w-0">{children}</div>
    </div>
  );
}
