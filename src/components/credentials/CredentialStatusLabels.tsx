import React from 'react';
import type { CourseUploadStatus } from '../../lib/certStatus';
import { CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL, getCourseUploadStatusLabel } from '../../lib/certStatus';
import type { CredentialSectionStatus } from '../../lib/credentialSectionStatus';
import { WfBadge } from '../ui/wireframe';

type WfBadgeTone = 'default' | 'primary' | 'success' | 'warning' | 'danger';

/** Boxed status badge used across credential section headers and rows. */
export function CredentialSectionStatusBadge({
  label,
  tone = 'warning',
}: {
  label: string;
  tone?: WfBadgeTone;
}) {
  return (
    <WfBadge tone={tone} className="!text-[10px] normal-case tracking-normal">
      {label}
    </WfBadge>
  );
}

export function CredentialSectionStatusDisplay({ status }: { status: CredentialSectionStatus }) {
  return <CredentialSectionStatusBadge label={status.label} tone={status.tone} />;
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

function listStatusTone(status: CredentialListStatus, staffMode: boolean): WfBadgeTone {
  if (status === 'on-file') return 'success';
  if (status === 'expired') return 'warning';
  if (status === 'listed') return staffMode ? 'warning' : 'default';
  return 'default';
}

/** Row-level upload status — boxed to match section headers. */
export function CredentialListStatusBadge({
  status,
  staffMode = false,
}: {
  status: CredentialListStatus;
  staffMode?: boolean;
}) {
  const label = credentialListStatusLabel(status, { staffMode });
  return <CredentialSectionStatusBadge label={label} tone={listStatusTone(status, staffMode)} />;
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
