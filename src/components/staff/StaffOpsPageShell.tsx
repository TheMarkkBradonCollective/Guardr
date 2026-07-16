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
    <div className={`animate-fade-in space-y-4 ${className}`.trim()} {...rest}>
      {toolbar}
      {children}
    </div>
  );
}
