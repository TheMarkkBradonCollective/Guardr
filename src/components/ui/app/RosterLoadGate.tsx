import React from 'react';
import { AppRequestState } from './AppPrimitives';
import { useDataLoadIssue } from '../../../hooks/useDataLoadIssue';

/**
 * When the global roster load failed, list screens currently look empty.
 * Show the shared error/retry state instead of a false "nothing here" empty.
 */
export function RosterLoadGate({
  itemCount,
  title,
  children,
}: {
  itemCount: number;
  title: string;
  children: React.ReactNode;
}) {
  const loadIssue = useDataLoadIssue();
  if (loadIssue && itemCount === 0) {
    return (
      <AppRequestState
        status="error"
        title={title}
        message={loadIssue}
        onRetry={() => window.location.reload()}
      />
    );
  }
  return <>{children}</>;
}
