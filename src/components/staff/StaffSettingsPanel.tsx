import React from 'react';
import { SessionUser, StaffRole } from '../../types';
import { PlatformSettings } from '../../lib/platformSettings';
import {
  canManagePlatformSettings,
  getAssignableStaffRoles,
} from '../../lib/permissions';
import { AppFormSection } from '../ui/app/AppPrimitives';
import { ResponsiveFormPage } from '../layouts/desktop/DesktopPageShell';
import { useDevice } from '../../lib/platform';
import { StaffAddStaffForm } from './StaffAddStaffForm';
import { StaffCompanyPlacardPanel } from './StaffCompanyPlacardPanel';
import type { CompanyPublicDocument } from '../../lib/companyPlacard';

interface StaffSettingsPanelProps {
  currentUser: SessionUser;
  platformSettings: PlatformSettings;
  onUpdatePlatformSettings?: (settings: PlatformSettings) => void | Promise<void>;
  showStaffOnboard: boolean;
  requiresDirectorApproval?: boolean;
  onAddStaffProfile: (
    email: string,
    badgeNumber: string,
    staffRole: StaffRole
  ) => Promise<string>;
  companyPublicDocuments?: CompanyPublicDocument[];
  onSaveCompanyPublicDocument?: (doc: CompanyPublicDocument) => Promise<void>;
  onSetCompanyPlacardPublicEnabled?: (enabled: boolean) => Promise<void>;
}

export function StaffSettingsPanel({
  currentUser,
  platformSettings,
  onUpdatePlatformSettings,
  showStaffOnboard,
  requiresDirectorApproval = false,
  onAddStaffProfile,
  companyPublicDocuments = [],
  onSaveCompanyPublicDocument,
  onSetCompanyPlacardPublicEnabled,
}: StaffSettingsPanelProps) {
  const { formFactor } = useDevice();
  const assignableRoles = getAssignableStaffRoles(currentUser.role);
  const canEdit = canManagePlatformSettings(currentUser);

  const persistSettings = async (patch: Partial<PlatformSettings>) => {
    if (!onUpdatePlatformSettings || !canEdit) return;
    await onUpdatePlatformSettings({
      ...platformSettings,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  };

  const body = (
    <div className={formFactor === 'desktop' ? 'adm-settings-panel' : 'animate-fade-in -mx-4 sm:-mx-5'}>
      {onSaveCompanyPublicDocument && onSetCompanyPlacardPublicEnabled && (
        <StaffCompanyPlacardPanel
          currentUser={currentUser}
          documents={companyPublicDocuments}
          publicEnabled={platformSettings.companyPlacardPublicEnabled !== false}
          onSaveDocument={onSaveCompanyPublicDocument}
          onSetPublicEnabled={onSetCompanyPlacardPublicEnabled}
        />
      )}

      <AppFormSection title="Homepage messages">
        <div className="pb-6 space-y-4">
          <label className="block space-y-1.5">
            <span className="uber-label">Founder message (Markeith White)</span>
            <textarea
              value={platformSettings.ownerMessage ?? ''}
              disabled={currentUser.role !== 'owner'}
              onChange={(e) =>
                canEdit &&
                onUpdatePlatformSettings?.({
                  ...platformSettings,
                  ownerMessage: e.target.value,
                  ownerMessageUpdatedAt: new Date().toISOString(),
                })
              }
              rows={4}
              className="uber-input w-full resize-y"
              placeholder="Message shown on the public homepage from the Founder account."
            />
          </label>
          <label className="block space-y-1.5">
            <span className="uber-label">Director message (Tyrone Johnson)</span>
            <textarea
              value={platformSettings.directorMessage ?? ''}
              disabled={currentUser.role !== 'owner' && currentUser.role !== 'director'}
              onChange={(e) =>
                (currentUser.role === 'owner' || currentUser.role === 'director') &&
                onUpdatePlatformSettings?.({
                  ...platformSettings,
                  directorMessage: e.target.value,
                  directorMessageUpdatedAt: new Date().toISOString(),
                })
              }
              rows={4}
              className="uber-input w-full resize-y"
              placeholder="Message shown on the public homepage from the Director account."
            />
          </label>
          {currentUser.role !== 'owner' && currentUser.role !== 'director' && (
            <p className="text-xs text-brand-text-muted">Homepage leadership messages are read-only for your role.</p>
          )}
        </div>
      </AppFormSection>

      <AppFormSection title="Approval rules">
        <div className="pb-6 space-y-4">
          <label className="uber-label block mb-1">Job posting review</label>
          <select
            className="uber-input w-full max-w-lg"
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
      </AppFormSection>

      <AppFormSection title="Integrations">
        <div className="pb-6 space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={platformSettings.smsNotificationsEnabled === true}
              disabled={!canEdit}
              onChange={(e) => void persistSettings({ smsNotificationsEnabled: e.target.checked })}
            />
            SMS notifications (Twilio — configure in env)
          </label>
          <label className="uber-label block">Background check provider</label>
          <select
            className="uber-input w-full max-w-lg"
            value={platformSettings.backgroundCheckProvider ?? 'manual'}
            disabled={!canEdit}
            onChange={(e) => void persistSettings({ backgroundCheckProvider: e.target.value })}
          >
            <option value="manual">Manual staff review</option>
            <option value="checkr">Checkr (API key required)</option>
          </select>
          <label className="uber-label block">Insurance verification</label>
          <select
            className="uber-input w-full max-w-lg"
            value={platformSettings.insuranceVerificationMode ?? 'manual'}
            disabled={!canEdit}
            onChange={(e) => void persistSettings({ insuranceVerificationMode: e.target.value })}
          >
            <option value="manual">Manual COI review</option>
            <option value="api">Automated verification API</option>
          </select>
        </div>
      </AppFormSection>

      {showStaffOnboard && assignableRoles.length > 0 && (
        <AppFormSection title="Onboard staff">
          <div className="pb-6">
            <p className="text-sm text-brand-text-muted mb-4">
              Submit new staff with a Staff ID and email. Administrators need Director approval before the account can sign in.
            </p>
            <StaffAddStaffForm
              assignableRoles={assignableRoles}
              requiresDirectorApproval={requiresDirectorApproval}
              onAdd={(input) =>
                onAddStaffProfile(input.email, input.badgeNumber, input.staffRole)
              }
            />
          </div>
        </AppFormSection>
      )}
    </div>
  );

  if (formFactor === 'desktop') {
    return (
      <ResponsiveFormPage title="Platform settings" subtitle="Homepage, approvals, integrations, and staff onboarding">
        {body}
      </ResponsiveFormPage>
    );
  }

  return body;
}
