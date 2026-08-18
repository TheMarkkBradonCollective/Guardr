import React, { useState } from 'react';
import { SecurityGuard } from '../../types';
import {
  getApplicationSnapshotCredentialSteps,
  applicationSnapshotHasAnyCredential,
  type ApplicationSnapshotStepStatus,
  type ApplicationCredentialSnapshotKey,
} from '../../lib/applicationSubmissionSnapshot';
import { getGuardApplicationCredentialSteps } from '../../lib/guardApplicationCredentialSteps';
import { ChevronRight } from 'lucide-react';
import { WfBadge } from '../ui/wireframe';
import { AppOverlaySheet } from '../ui/motion/AppMotion';
import { formatApprovalTimestamp } from '../../lib/staffApprovalsFeed';

interface StaffGuardActivationChecklistViewProps {
  guard: SecurityGuard;
  onViewCredential?: (credentialItemId: string) => void;
}

function statusTone(status: ApplicationSnapshotStepStatus): 'default' | 'warning' | 'success' {
  if (status === 'verified') return 'success';
  if (status === 'submitted') return 'warning';
  return 'default';
}

function statusLabel(status: ApplicationSnapshotStepStatus): string {
  if (status === 'verified') return 'Verified';
  if (status === 'submitted') return 'Submitted with application';
  return 'Not on application';
}

function ApplicationCredentialRow({
  index,
  label,
  status,
  summary,
  viewable,
  onView,
}: {
  index: number;
  label: string;
  status: ApplicationSnapshotStepStatus;
  summary?: string;
  viewable: boolean;
  onView?: () => void;
}) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-brand-text">
          {index}. {label}
        </p>
        {summary && <p className="text-xs text-brand-text-muted mt-0.5">{summary}</p>}
      </div>
      <WfBadge tone={statusTone(status)} className="shrink-0">
        {statusLabel(status)}
      </WfBadge>
      {viewable && <ChevronRight className="w-4 h-4 text-brand-text-muted shrink-0" aria-hidden />}
    </>
  );

  if (!viewable || !onView) {
    return <div className="flex items-center gap-2 py-2">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onView}
      className="flex w-full items-center gap-2 py-2 text-left rounded-lg hover:bg-brand-bg-sec/80 transition-colors"
    >
      {content}
    </button>
  );
}

function SnapshotCredentialDetail({
  guard,
  stepKey,
  onClose,
}: {
  guard: SecurityGuard;
  stepKey: ApplicationCredentialSnapshotKey;
  onClose: () => void;
}) {
  const entry = guard.applicationSubmissionSnapshot?.credentials?.[stepKey];
  if (!entry) return null;
  const payload = entry.payload ?? {};

  return (
    <AppOverlaySheet open onClose={onClose} ariaLabel={entry.label} panelClassName="rounded-t-2xl">
      <div className="flex flex-col flex-1 min-h-0 h-full">
        <div className="shrink-0 px-5 pt-4 pb-3 border-b border-brand-border">
          <p className="text-xs text-brand-text-muted mb-1">{guard.name}</p>
          <h2 className="font-bold text-lg leading-snug">{entry.label}</h2>
          <p className="text-xs text-brand-text-muted mt-1">
            Submitted with application · {formatApprovalTimestamp(entry.capturedAt)}
          </p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
          {entry.summary && <p className="text-sm text-brand-text">{entry.summary}</p>}
          {entry.documentUrl && (
            <img
              src={entry.documentUrl}
              alt={`${entry.label} submitted with application`}
              className="w-full max-h-80 object-contain rounded-xl border border-brand-border bg-brand-bg-sec"
            />
          )}
          {typeof payload.idFrontUrl === 'string' && payload.idFrontUrl !== entry.documentUrl && (
            <img
              src={payload.idFrontUrl}
              alt="ID front"
              className="w-full max-h-60 object-contain rounded-xl border border-brand-border"
            />
          )}
          {typeof payload.idBackUrl === 'string' && (
            <img
              src={payload.idBackUrl}
              alt="ID back"
              className="w-full max-h-60 object-contain rounded-xl border border-brand-border"
            />
          )}
          {typeof payload.idSelfieUrl === 'string' && (
            <img
              src={payload.idSelfieUrl}
              alt="Identity selfie"
              className="w-full max-h-60 object-contain rounded-xl border border-brand-border"
            />
          )}
          <p className="text-xs text-brand-text-muted leading-relaxed">
            This is the copy on the application package. Later uploads for activation live under
            Credentials and do not change this submission.
          </p>
        </div>
      </div>
    </AppOverlaySheet>
  );
}

/** Staff application view: credentials as submitted with the application (frozen package). */
export function StaffGuardActivationChecklistView({
  guard,
  onViewCredential,
}: StaffGuardActivationChecklistViewProps) {
  const [snapshotKey, setSnapshotKey] = useState<ApplicationCredentialSnapshotKey | null>(null);
  const hasSnapshot = applicationSnapshotHasAnyCredential(guard);
  const snapshotSteps = getApplicationSnapshotCredentialSteps(guard);
  const liveSteps = getGuardApplicationCredentialSteps(guard);

  return (
    <section className="app-checklist-panel">
      <div>
        <p className="text-sm font-semibold">Application credentials</p>
        <p className="text-xs text-brand-text-muted mt-1">
          {hasSnapshot
            ? 'What was submitted with this application. Later uploads do not change this package.'
            : 'Credentials on file for this application — including details added on the profile. Later uploads live under Credentials.'}
        </p>
      </div>
      <div className="app-checklist-steps mt-3">
        {(hasSnapshot ? snapshotSteps : liveSteps.map((step) => ({
            key: step.key as ApplicationCredentialSnapshotKey,
            label: step.label,
            status: step.status as ApplicationSnapshotStepStatus,
            summary: undefined,
            fromSnapshot: false,
          }))).map((step, index) => {
          const live = liveSteps.find((s) => s.key === step.key);
          const viewable = step.fromSnapshot
            ? Boolean(guard.applicationSubmissionSnapshot?.credentials?.[step.key])
            : Boolean(live?.credentialItemId);
          return (
            <ApplicationCredentialRow
              key={step.key}
              index={index + 1}
              label={step.label}
              status={step.status}
              summary={step.fromSnapshot ? step.summary : undefined}
              viewable={viewable}
              onView={
                viewable
                  ? () => {
                      if (step.fromSnapshot) {
                        setSnapshotKey(step.key);
                        return;
                      }
                      if (live?.credentialItemId) onViewCredential?.(live.credentialItemId);
                    }
                  : undefined
              }
            />
          );
        })}
      </div>
      {snapshotKey && (
        <SnapshotCredentialDetail
          guard={guard}
          stepKey={snapshotKey}
          onClose={() => setSnapshotKey(null)}
        />
      )}
    </section>
  );
}
