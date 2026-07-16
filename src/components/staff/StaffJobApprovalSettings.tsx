import React from 'react';
import { SessionUser } from '../../types';
import { PlatformSettings } from '../../lib/platformSettings';
import { canManagePlatformSettings } from '../../lib/permissions';
import { AppFormSection } from '../ui/app/AppPrimitives';
import { useDevice } from '../../lib/platform';

interface StaffJobApprovalSettingsProps {
  currentUser: SessionUser;
  platformSettings: PlatformSettings;
  onUpdatePlatformSettings?: (settings: PlatformSettings) => void | Promise<void>;
}

function ApprovalRulesFields({
  platformSettings,
  canEdit,
  onUpdatePlatformSettings,
}: {
  platformSettings: PlatformSettings;
  canEdit: boolean;
  onUpdatePlatformSettings?: (settings: PlatformSettings) => void | Promise<void>;
}) {
  const persistSettings = async (patch: Partial<PlatformSettings>) => {
    if (!onUpdatePlatformSettings || !canEdit) return;
    await onUpdatePlatformSettings({
      ...platformSettings,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
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
      <p id="job-review-note" className="text-xs text-brand-text-muted">
        Trusted clients with valid map coordinates skip the approval queue when auto-publish is enabled.
        Mark clients as trusted from the Clients panel.
      </p>
    </div>
  );
}

export function StaffJobApprovalSettings({
  currentUser,
  platformSettings,
  onUpdatePlatformSettings,
}: StaffJobApprovalSettingsProps) {
  const { formFactor } = useDevice();
  const canEdit = canManagePlatformSettings(currentUser);
  const fields = (
    <ApprovalRulesFields
      platformSettings={platformSettings}
      canEdit={canEdit}
      onUpdatePlatformSettings={onUpdatePlatformSettings}
    />
  );

  if (formFactor === 'desktop') {
    return (
      <section className="adm-card adm-job-approval-settings-card mb-3">
        <h3 className="adm-card-title adm-job-approval-settings-card-title">Approval rules</h3>
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
