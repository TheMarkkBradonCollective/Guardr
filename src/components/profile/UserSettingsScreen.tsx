import React from 'react';
import type { SessionUser } from '../../types';
import { PushNotificationsPanel } from './PushNotificationsPanel';
import { AppFormSection, AppScreen } from '../ui/app/AppPrimitives';
import { LegalInfoCards } from '../legal/LegalInfoCards';
import type { LegalPageId } from '../../lib/legalContent';
import { LEGAL_DISCLAIMER_SHORT } from '../../lib/legalContent';
import { ThemeToggle } from '../ui/ThemeToggle';
import type { ThemeMode } from '../../lib/platform/theme';
import { appVersionLabel } from '../../lib/appVersion';
import { isNativeShell } from '../../lib/platform/device';
import { SITE_URL } from '../../lib/siteConfig';
import { GuardCrewJoinSection } from '../guard/GuardCrewJoinSection';

interface UserSettingsScreenProps {
  currentUser: SessionUser;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  isDbConnected?: boolean;
  onOpenLegal?: (page: LegalPageId) => void;
  onJoinTeamWithCode?: (code: string) => void | Promise<void>;
}

export function UserSettingsScreen({
  currentUser,
  themeMode,
  onChangeTheme,
  isDbConnected = false,
  onOpenLegal,
  onJoinTeamWithCode,
}: UserSettingsScreenProps) {
  return (
    <AppScreen className="guard-settings-screen">
      {currentUser.role === 'guard' && (
        <AppFormSection title="Work preferences">
          <p className="text-sm text-brand-text-muted leading-relaxed">
            Job alerts are under <span className="font-semibold text-brand-text">Preferences</span>{' '}
            in the sidebar. Weekly availability is under{' '}
            <span className="font-semibold text-brand-text">Availability</span>.
          </p>
        </AppFormSection>
      )}

      {currentUser.role === 'guard' && onJoinTeamWithCode && (
        <div className="guard-settings-crew-wrap">
          <GuardCrewJoinSection onJoin={onJoinTeamWithCode} />
        </div>
      )}

      <AppFormSection title="Appearance">
        <ThemeToggle value={themeMode} onChange={onChangeTheme} size="md" className="w-full justify-center" />
      </AppFormSection>

      <section className="border-b border-brand-border">
        <PushNotificationsPanel currentUser={currentUser} isDbConnected={isDbConnected} />
      </section>

      {onOpenLegal && (
        <AppFormSection title="Legal">
          <p className="text-xs text-brand-text-muted leading-relaxed mb-4 -mt-2">{LEGAL_DISCLAIMER_SHORT}</p>
          <LegalInfoCards onOpenLegal={onOpenLegal} />
        </AppFormSection>
      )}

      <AppFormSection title="About">
        <p className="text-sm text-brand-text-muted">
          {appVersionLabel()}
          {isNativeShell() ? ' · Android app' : ' · Web'}
        </p>
        {isNativeShell() && (
          <p className="text-xs text-brand-text-muted mt-2 leading-relaxed">
            Updates ship with new APK builds. Compare with the live site at{' '}
            <a href={`${SITE_URL}/download/`} className="text-brand-primary font-semibold underline">
              {SITE_URL}/download/
            </a>
            .
          </p>
        )}
      </AppFormSection>
    </AppScreen>
  );
}
