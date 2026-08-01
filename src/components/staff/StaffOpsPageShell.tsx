import React from 'react';
import { useDevice } from '../../lib/platform';
import { WorkbenchBody, WorkbenchPage, WorkbenchPanel } from '../baseui/layout/WorkbenchLayout';

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
      <WorkbenchPage className={`uber-ops-page ${className}`.trim()} {...rest}>
        {toolbar}
        <WorkbenchPanel padding={false}>
          <WorkbenchBody className="uber-ops-page-body">{children}</WorkbenchBody>
        </WorkbenchPanel>
      </WorkbenchPage>
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
