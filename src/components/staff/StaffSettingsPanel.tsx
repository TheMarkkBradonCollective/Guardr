import React from 'react';
import { SessionUser } from '../../types';
import { PlatformSettings } from '../../lib/platformSettings';
import { AppFormSection } from '../ui/app/AppPrimitives';
import { useDevice } from '../../lib/platform';
import { WorkbenchToolbar } from '../baseui/layout/WorkbenchLayout';
import { StaffCompanyPlacardPanel } from './StaffCompanyPlacardPanel';
import { StaffMgmtSection } from './StaffMgmtSection';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import type { CompanyPublicDocument } from '../../lib/companyPlacard';

interface StaffSettingsPanelProps {
  currentUser: SessionUser;
  platformSettings: PlatformSettings;
  onUpdatePublicInformation?: (
    patch: Pick<
      PlatformSettings,
      'ownerMessage' | 'directorMessage' | 'ownerMessageUpdatedAt' | 'directorMessageUpdatedAt'
    >
  ) => void | Promise<void>;
  companyPublicDocuments?: CompanyPublicDocument[];
  onSaveCompanyPublicDocument?: (doc: CompanyPublicDocument) => Promise<void>;
  onSetCompanyPlacardPublicEnabled?: (enabled: boolean) => Promise<void>;
}

function DesktopSettingsCard({
  title,
  children,
  className = '',
  fullWidth = false,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <StaffMgmtSection title={title} className={className} fullWidth={fullWidth}>
      {children}
    </StaffMgmtSection>
  );
}

export function StaffSettingsPanel({
  currentUser,
  platformSettings,
  onUpdatePublicInformation,
  companyPublicDocuments = [],
  onSaveCompanyPublicDocument,
  onSetCompanyPlacardPublicEnabled,
}: StaffSettingsPanelProps) {
  const { formFactor } = useDevice();
  const isDesktop = formFactor === 'desktop';

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
            currentUser.role === 'owner' &&
            onUpdatePublicInformation?.({
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
            onUpdatePublicInformation?.({
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

  if (isDesktop) {
    return (
      <StaffOpsPageShell
        className="staff-mgmt-panel staff-roster-panel adm-platform-page adm-platform-settings-page"
        toolbar={
          <WorkbenchToolbar
            eyebrow="Platform"
            subtitle="Homepage messages and public placard."
          />
        }
      >
        <div className="adm-platform-settings-grid adm-platform-settings-grid--split">
          <DesktopSettingsCard title="Homepage messages">{homepageMessagesBody}</DesktopSettingsCard>
          {companyPlacardBody && (
            <DesktopSettingsCard title="Company public placard" fullWidth>
              {companyPlacardBody}
            </DesktopSettingsCard>
          )}
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
    </div>
  );
}
