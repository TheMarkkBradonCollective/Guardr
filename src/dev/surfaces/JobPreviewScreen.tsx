import React from 'react';
import { StaffJobDetailPanel } from '../../components/staff/StaffJobDetailPanel';
import { PREVIEW_JOB } from '../previewStaffFixtures';

/** Live job detail panel against a fixture so jobs use the same surface language as profiles. */
export function JobPreviewScreen() {
  return (
    <StaffJobDetailPanel
      req={PREVIEW_JOB}
      guards={[]}
      canEditJobListing
      staffRole="director"
      onApproveRequest={() => undefined}
      onDenyRequest={() => undefined}
      onEditJobListing={() => undefined}
      onBack={() => undefined}
    />
  );
}
