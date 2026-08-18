import React from 'react';
import { SessionUser } from '../../types';
import { PlatformSettings } from '../../lib/platformSettings';
import { GuardrCard } from '../baseui/GuardrCard';
import { WorkbenchCardTitle } from '../baseui/layout/WorkbenchLayout';
import { AppFormSection } from '../ui/app/AppPrimitives';
import { useLayoutFormFactor } from '../../surfaces';

interface StaffJobApprovalSettingsProps {
  currentUser: SessionUser;
  platformSettings: PlatformSettings;
  canEdit?: boolean;
  onPersistSettings?: (patch: Partial<PlatformSettings>) => void | Promise<void>;
  /** When true, skip outer card/section wrapper (parent provides layout). */
  embedded?: boolean;
}

function ApprovalRulesFields({
  platformSettings,
  canEdit,
  onPersistSettings,
}: {
  platformSettings: PlatformSettings;
  canEdit: boolean;
  onPersistSettings?: (patch: Partial<PlatformSettings>) => void | Promise<void>;
}) {
  const persistSettings = async (patch: Partial<PlatformSettings>) => {
    if (!onPersistSettings || !canEdit) return;
    await onPersistSettings(patch);
  };

  return (
    <div className="space-y-4">
      <label className="uber-label block mb-1">Job posting review</label>
      <select
        className="uber-input w-full"
        value={platformSettings.jobReviewMode ?? 'trusted-auto'}
        disabled={!canEdit}
        onChange={(e) => {
          const jobReviewMode = e.target.value as PlatformSettings['jobReviewMode'];
          void persistSettings({ jobReviewMode });
        }}
        aria-describedby="job-review-note"
      >
        <option value="staff-all">All jobs require staff review</option>
        <option value="trusted-auto">Trusted clients auto-publish (with coordinates)</option>
        <option value="none">No review — all jobs go live immediately</option>
      </select>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={platformSettings.trustedClientAutoPublish !== false}
          disabled={!canEdit}
          onChange={(e) => void persistSettings({ trustedClientAutoPublish: e.target.checked })}
        />
        Enable trusted-client auto-publish
      </label>
      <p id="job-review-note" className="text-xs uber-text-muted">
        Trusted clients with valid map coordinates skip the approval queue when auto-publish is enabled.
        Mark clients as trusted from the Clients panel.
      </p>
    </div>
  );
}

export function StaffJobApprovalSettings({
  currentUser: _currentUser,
  platformSettings,
  canEdit = false,
  onPersistSettings,
  embedded = false,
}: StaffJobApprovalSettingsProps) {
  const formFactor = useLayoutFormFactor();
  const fields = (
    <ApprovalRulesFields
      platformSettings={platformSettings}
      canEdit={canEdit}
      onPersistSettings={onPersistSettings}
    />
  );

  if (embedded) {
    return fields;
  }

  if (formFactor === 'desktop') {
    return (
      <GuardrCard className="mb-3">
        <WorkbenchCardTitle>Approval rules</WorkbenchCardTitle>
        {fields}
      </GuardrCard>
    );
  }

  if (formFactor === 'tablet') {
    return (
      <section className="sft-approval-rules">
        <h2 className="sft-approval-rules-title">Approval rules</h2>
        {fields}
      </section>
    );
  }

  return (
    <AppFormSection title="Approval rules">
      <div className="pb-6">{fields}</div>
    </AppFormSection>
  );
}
