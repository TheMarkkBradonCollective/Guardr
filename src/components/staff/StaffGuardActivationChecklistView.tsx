import React from 'react';
import { SecurityGuard } from '../../types';
import {
  getGuardApplicationCredentialSteps,
  GUARD_APPLICATION_CREDENTIAL_STATUS_LABELS,
  type GuardApplicationCredentialStepStatus,
} from '../../lib/guardApplicationCredentialSteps';
import { ChevronRight } from 'lucide-react';
import { WfBadge } from '../ui/wireframe';

interface StaffGuardActivationChecklistViewProps {
  guard: SecurityGuard;
  onViewCredential?: (credentialItemId: string) => void;
}

function statusTone(status: GuardApplicationCredentialStepStatus): 'default' | 'warning' | 'success' {
  if (status === 'verified') return 'success';
  if (status === 'submitted') return 'warning';
  return 'default';
}

function ApplicationCredentialRow({
  index,
  label,
  status,
  viewable,
  onView,
}: {
  index: number;
  label: string;
  status: GuardApplicationCredentialStepStatus;
  viewable: boolean;
  onView?: () => void;
}) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-brand-text">
          {index}. {label}
        </p>
      </div>
      <WfBadge tone={statusTone(status)} className="shrink-0">
        {GUARD_APPLICATION_CREDENTIAL_STATUS_LABELS[status]}
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

/** Staff application view: required credentials with status — tap to preview in a popup. */
export function StaffGuardActivationChecklistView({
  guard,
  onViewCredential,
}: StaffGuardActivationChecklistViewProps) {
  const steps = getGuardApplicationCredentialSteps(guard);

  return (
    <section className="app-checklist-panel">
      <div>
        <p className="text-sm font-semibold">Application credentials</p>
      </div>
      <div className="app-checklist-steps mt-3">
        {steps.map((step, index) => (
          <ApplicationCredentialRow
            key={step.key}
            index={index + 1}
            label={step.label}
            status={step.status}
            viewable={Boolean(step.credentialItemId && onViewCredential)}
            onView={
              step.credentialItemId && onViewCredential
                ? () => onViewCredential(step.credentialItemId!)
                : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}
