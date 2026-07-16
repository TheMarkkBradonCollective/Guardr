import React from 'react';
import { useDevice } from '../../lib/platform';

interface StaffOpsPageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  toolbar?: React.ReactNode;
}

/** Desktop admin workbench wrapper for Operations nav pages (jobs, guards, clients, etc.). */
export function StaffOpsPageShell({
  children,
  toolbar,
  className = '',
  ...rest
}: StaffOpsPageShellProps) {
  const { formFactor } = useDevice();

  if (formFactor === 'desktop') {
    return (
      <div className={`adm-workbench adm-ops-page ${className}`.trim()} {...rest}>
        {toolbar ? <div className="adm-workbench-toolbar adm-ops-toolbar">{toolbar}</div> : null}
        <div className="adm-ops-page-body">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={`staff-ops-mobile-shell animate-fade-in flex flex-col h-full min-h-0 min-w-0 ${className}`.trim()}
      {...rest}
    >
      {toolbar ? <div className="staff-ops-mobile-toolbar shrink-0">{toolbar}</div> : null}
      <div className="staff-ops-mobile-body flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  );
}
