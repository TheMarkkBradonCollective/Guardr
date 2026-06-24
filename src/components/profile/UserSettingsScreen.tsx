import React from 'react';
import type { SessionUser } from '../../types';
import { PushNotificationsPanel } from './PushNotificationsPanel';
import { AppFormSection, AppScreen } from '../ui/app/AppPrimitives';
import { LegalInfoCards } from '../legal/LegalInfoCards';
import type { LegalPageId } from '../../lib/legalContent';
import { LEGAL_DISCLAIMER_SHORT } from '../../lib/legalContent';
import { ThemeToggle } from '../ui/ThemeToggle';
import type { ThemeMode } from '../../lib/platform/theme';
import { TeamCodeJoinPanel } from '../guard/TeamCodeJoinPanel';

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
    <AppScreen>
      {currentUser.role === 'guard' && onJoinTeamWithCode && (
        <AppFormSection title="Crew team code">
          <TeamCodeJoinPanel onJoin={onJoinTeamWithCode} />
        </AppFormSection>
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
    </AppScreen>
  );
}
