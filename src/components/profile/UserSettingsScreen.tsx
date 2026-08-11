import React from 'react';
import type { SessionUser } from '../../types';
import { PushNotificationsPanel } from './PushNotificationsPanel';
import {
  AppSettingsHead,
  AppSettingsSection,
} from '../ui/app/AppPrimitives';
import { ResponsiveFormPage, ResponsivePage } from '../layouts/desktop/DesktopPageShell';
import { LegalInfoCards } from '../legal/LegalInfoCards';
import type { LegalPageId } from '../../lib/legalContent';
import { LEGAL_DISCLAIMER_SHORT } from '../../lib/legalContent';
import { useDevice } from '../../lib/platform';
import { AppUpdatePanel } from '../app/AppUpdatePanel';
import { UserManualDownloads } from '../docs/UserManualDownloads';

interface UserSettingsScreenProps {
  currentUser: SessionUser;
  isDbConnected?: boolean;
  onOpenLegal?: (page: LegalPageId) => void;
  onOpenDownload?: () => void;
}

export function UserSettingsScreen({
  currentUser,
  isDbConnected = false,
  onOpenLegal,
  onOpenDownload,
}: UserSettingsScreenProps) {
  const { shellKind } = useDevice();
  const surfaceLabel =
    shellKind === 'native' ? 'Android app' : shellKind === 'pwa' ? 'Installed app' : 'Web';

  const formContent = (
    <>
      {currentUser.role === 'guard' && (
        <>
          <AppSettingsHead>Work preferences</AppSettingsHead>
          <AppSettingsSection>
            <p className="text-sm text-brand-text-muted leading-relaxed">
              Job alerts are under <span className="font-semibold text-brand-text">Preferences</span>{' '}
              in the sidebar. Weekly availability is under{' '}
              <span className="font-semibold text-brand-text">Availability</span>.
            </p>
          </AppSettingsSection>
        </>
      )}

      <PushNotificationsPanel currentUser={currentUser} isDbConnected={isDbConnected} />

      <AppUpdatePanel onOpenDownload={onOpenDownload} />

      <AppSettingsHead>User manuals</AppSettingsHead>
      <AppSettingsSection>
        <UserManualDownloads audienceFilter={currentUser.role} variant="embedded" />
      </AppSettingsSection>

      {onOpenLegal && (
        <>
          <AppSettingsHead>Legal</AppSettingsHead>
          <AppSettingsSection>
            <p className="text-xs text-brand-text-muted leading-relaxed mb-4">{LEGAL_DISCLAIMER_SHORT}</p>
            <LegalInfoCards onOpenLegal={onOpenLegal} />
          </AppSettingsSection>
        </>
      )}

      <AppSettingsHead>About</AppSettingsHead>
      <AppSettingsSection>
        <p className="text-sm text-brand-text-muted">
          Running on {surfaceLabel}
        </p>
      </AppSettingsSection>
    </>
  );

  return (
    <ResponsivePage screenClassName="guard-settings-screen">
      <ResponsiveFormPage
        title="Settings"
        subtitle="Notifications, manuals, updates, and legal"
        className="guard-settings-screen"
      >
        {formContent}
      </ResponsiveFormPage>
    </ResponsivePage>
  );
}
