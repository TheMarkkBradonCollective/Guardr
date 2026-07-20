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
import { ThemeToggle } from '../ui/ThemeToggle';
import type { ThemeMode } from '../../lib/platform/theme';
import { appVersionLabel } from '../../lib/appVersion';
import { useDevice } from '../../lib/platform';
import { SITE_URL } from '../../lib/siteConfig';

interface UserSettingsScreenProps {
  currentUser: SessionUser;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  isDbConnected?: boolean;
  onOpenLegal?: (page: LegalPageId) => void;
}

export function UserSettingsScreen({
  currentUser,
  themeMode,
  onChangeTheme,
  isDbConnected = false,
  onOpenLegal,
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

      <AppSettingsHead>Appearance</AppSettingsHead>
      <AppSettingsSection>
        <ThemeToggle value={themeMode} onChange={onChangeTheme} size="md" className="w-full justify-center" />
      </AppSettingsSection>

      <PushNotificationsPanel currentUser={currentUser} isDbConnected={isDbConnected} />

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
          {appVersionLabel()}
          {' · '}
          {surfaceLabel}
        </p>
        {shellKind === 'native' && (
          <p className="text-xs text-brand-text-muted mt-2 leading-relaxed">
            Updates ship with new APK builds. Compare with the live site at{' '}
            <a href={`${SITE_URL}/download/`} className="text-brand-primary font-semibold underline break-all">
              {SITE_URL}/download/
            </a>
            .
          </p>
        )}
      </AppSettingsSection>
    </>
  );

  return (
    <ResponsivePage screenClassName="guard-settings-screen">
      <ResponsiveFormPage
        title="Settings"
        subtitle="Appearance, notifications, and legal"
        className="guard-settings-screen"
      >
        {formContent}
      </ResponsiveFormPage>
    </ResponsivePage>
  );
}
