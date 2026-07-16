import React from 'react';
import { SessionUser } from '../../types';
import { PlatformSettings } from '../../lib/platformSettings';
import { canManagePlatformSettings } from '../../lib/permissions';
import { AppFormSection } from '../ui/app/AppPrimitives';
import { useDevice } from '../../lib/platform';
import { StaffCompanyPlacardPanel } from './StaffCompanyPlacardPanel';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import type { CompanyPublicDocument } from '../../lib/companyPlacard';

interface StaffSettingsPanelProps {
  currentUser: SessionUser;
  platformSettings: PlatformSettings;
  onUpdatePlatformSettings?: (settings: PlatformSettings) => void | Promise<void>;
  companyPublicDocuments?: CompanyPublicDocument[];
  onSaveCompanyPublicDocument?: (doc: CompanyPublicDocument) => Promise<void>;
  onSetCompanyPlacardPublicEnabled?: (enabled: boolean) => Promise<void>;
}

function DesktopSettingsCard({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`adm-card adm-platform-settings-card ${className}`.trim()}>
      <h3 className="adm-card-title adm-platform-settings-card-title">{title}</h3>
      {children}
    </section>
  );
}

export function StaffSettingsPanel({
  currentUser,
  platformSettings,
  onUpdatePlatformSettings,
  companyPublicDocuments = [],
  onSaveCompanyPublicDocument,
  onSetCompanyPlacardPublicEnabled,
}: StaffSettingsPanelProps) {
  const { formFactor } = useDevice();
  const canEdit = canManagePlatformSettings(currentUser);
  const isDesktop = formFactor === 'desktop';

  const persistSettings = async (patch: Partial<PlatformSettings>) => {
    if (!onUpdatePlatformSettings || !canEdit) return;
    await onUpdatePlatformSettings({
      ...platformSettings,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  };

  const companyPlacardBody =
    onSaveCompanyPublicDocument && onSetCompanyPlacardPublicEnabled ? (
      <StaffCompanyPlacardPanel
        currentUser={currentUser}
        documents={companyPublicDocuments}
        publicEnabled={platformSettings.companyPlacardPublicEnabled !== false}
        onSaveDocument={onSaveCompanyPublicDocument}
        onSetPublicEnabled={onSetCompanyPlacardPublicEnabled}
        variant={isDesktop ? 'desktop' : 'mobile'}
      />
    ) : null;

  const homepageMessagesBody = (
    <div className="space-y-4">
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
        <p className="text-xs text-brand-text-muted">
          Homepage leadership messages are read-only for your role.
        </p>
      )}
    </div>
  );

  const integrationsBody = (
    <div className="space-y-4">
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
        className="uber-input w-full"
        value={platformSettings.backgroundCheckProvider ?? 'manual'}
        disabled={!canEdit}
        onChange={(e) => void persistSettings({ backgroundCheckProvider: e.target.value })}
      >
        <option value="manual">Manual staff review</option>
        <option value="checkr">Checkr (API key required)</option>
      </select>
      <label className="uber-label block">Insurance verification</label>
      <select
        className="uber-input w-full"
        value={platformSettings.insuranceVerificationMode ?? 'manual'}
        disabled={!canEdit}
        onChange={(e) => void persistSettings({ insuranceVerificationMode: e.target.value })}
      >
        <option value="manual">Manual COI review</option>
        <option value="api">Automated verification API</option>
      </select>
    </div>
  );

  if (isDesktop) {
    return (
      <StaffOpsPageShell
        className="adm-platform-page adm-platform-settings-page"
        toolbar={
          <div>
            <p className="adm-card-eyebrow">Platform</p>
            <p className="adm-workbench-subtitle">
              Homepage messages and integrations.
            </p>
          </div>
        }
      >
        <div className="adm-platform-settings-grid">
          <DesktopSettingsCard title="Homepage messages">{homepageMessagesBody}</DesktopSettingsCard>
          {companyPlacardBody && (
            <DesktopSettingsCard title="Company public placard" className="adm-platform-settings-card--full">
              {companyPlacardBody}
            </DesktopSettingsCard>
          )}
          <DesktopSettingsCard title="Integrations">{integrationsBody}</DesktopSettingsCard>
        </div>
      </StaffOpsPageShell>
    );
  }

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      <AppFormSection title="Homepage messages">
        <div className="pb-6">{homepageMessagesBody}</div>
      </AppFormSection>

      {companyPlacardBody}

      <AppFormSection title="Integrations">
        <div className="pb-6">{integrationsBody}</div>
      </AppFormSection>
    </div>
  );
}
