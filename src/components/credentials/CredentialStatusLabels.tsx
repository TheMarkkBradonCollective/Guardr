import React from 'react';
import type { CourseUploadStatus } from '../../lib/certStatus';
import { CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL, getCourseUploadStatusLabel } from '../../lib/certStatus';
import { WfBadge } from '../ui/wireframe';

/** Orange warning badge for section headers — PTA/UOF, 32-hour block, Government ID, guard card. */
export function CredentialSectionStatusBadge({ label }: { label: string }) {
  return (
    <WfBadge tone="warning" className="!text-[10px]">
      {label}
    </WfBadge>
  );
}

export type CredentialListStatus = CourseUploadStatus | 'not-listed';

export function credentialListStatusLabel(
  status: CredentialListStatus,
  options?: { staffMode?: boolean }
): string {
  if (status === 'not-listed') {
    return options?.staffMode ? 'Not listed' : CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL;
  }
  return getCourseUploadStatusLabel(status, options);
}

/** Row-level upload status — matches 32-hour course rows; missing/not-listed use the same warning badge. */
export function CredentialListStatusBadge({
  status,
  staffMode = false,
}: {
  status: CredentialListStatus;
  staffMode?: boolean;
}) {
  if (status === 'on-file') {
    return <span className="shrink-0 text-[10px] font-semibold text-brand-primary">On file</span>;
  }
  if (status === 'listed') {
    if (staffMode) {
      return (
        <span className="shrink-0 text-[10px] font-bold uppercase text-brand-text-muted">Listed</span>
      );
    }
    return <CredentialSectionStatusBadge label={CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL} />;
  }
  if (status === 'expired') {
    return <CredentialSectionStatusBadge label="On file · Expired" />;
  }
  if (status === 'not-listed') {
    return (
      <CredentialSectionStatusBadge
        label={staffMode ? 'Not listed' : CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL}
      />
    );
  }
  return <CredentialSectionStatusBadge label={CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL} />;
}

/** Aggregate upload counts for section headers — e.g. "5 not listed or on file and another 1 listed and another 3 on file". */
export function CredentialSectionStatusSummary({ summary }: { summary: string }) {
  return (
    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 normal-case tracking-normal">
      {summary}
    </span>
  );
}

/** Consistent section-header action for credential uploads. */
export function CredentialSectionAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="app-button-primary !w-auto !h-8 !px-3 !text-xs shrink-0"
    >
      Add
    </button>
  );
}
