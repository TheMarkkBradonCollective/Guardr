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
    <WfBadge tone={tone} className="credential-status-badge !text-[10px] normal-case tracking-normal">
      {label}
    </WfBadge>
  );
}

export function CredentialSectionStatusDisplay({ status }: { status: CredentialSectionStatus }) {
  return (
    <div className="credential-section-status">
      <CredentialSectionStatusBadge label={status.label} tone={status.tone} />
    </div>
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

function listStatusTone(status: CredentialListStatus, staffMode: boolean): WfBadgeTone {
  if (status === 'on-file' || status === 'expired') return 'primary';
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

export function credentialNeedsUploadAction(status: CredentialListStatus): boolean {
  return status === 'missing' || status === 'listed';
}

/** Title + subtitle block with optional action — wraps cleanly on narrow screens. */
export function CredentialRowHeader({
  title,
  subtitle,
  action,
  titleMuted = false,
  rawTitle = false,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  titleMuted?: boolean;
  /** When true, title is rendered as-is (for section labels with custom styling). */
  rawTitle?: boolean;
}) {
  return (
    <div className="credential-row-header">
      <div className="credential-row-header__main">
        {rawTitle ? (
          title
        ) : (
          <div
            className={`text-sm font-semibold leading-snug break-words ${
              titleMuted ? 'text-brand-text-muted' : 'text-brand-text'
            }`}
          >
            {title}
          </div>
        )}
        {subtitle ? (
          typeof subtitle === 'string' ? (
            <p className="text-[10px] text-brand-text-muted mt-0.5 leading-snug break-words">{subtitle}</p>
          ) : (
            <div className="mt-0.5">{subtitle}</div>
          )
        ) : null}
      </div>
      {action ? <div className="credential-row-header__action">{action}</div> : null}
    </div>
  );
}

/**
 * Per-row / per-section header action: staff always sees status; guards see Add only while upload is still needed.
 */
export function CredentialRowAction({
  staffMode = false,
  uploadStatus,
  canUpload,
  onAdd,
}: {
  staffMode?: boolean;
  uploadStatus: CredentialListStatus;
  canUpload: boolean;
  onAdd: () => void;
}) {
  if (staffMode || !credentialNeedsUploadAction(uploadStatus)) {
    return <CredentialListStatusBadge status={uploadStatus} staffMode={staffMode} />;
  }
  if (canUpload) {
    return <CredentialSectionAddButton onClick={onAdd} />;
  }
  return <CredentialListStatusBadge status={uploadStatus} staffMode={staffMode} />;
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
