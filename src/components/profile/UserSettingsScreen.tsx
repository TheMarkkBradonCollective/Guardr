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
  tutorialAvailable?: boolean;
  tutorialCompleted?: boolean;
  tutorialActive?: boolean;
  onStartTutorial?: () => void;
  onEnterPracticeMode?: () => void;
}

export function UserSettingsScreen({
  currentUser,
  themeMode,
  onChangeTheme,
  isDbConnected = false,
  onOpenLegal,
  onJoinTeamWithCode,
  tutorialAvailable = false,
  tutorialCompleted = false,
  tutorialActive = false,
  onStartTutorial,
  onEnterPracticeMode,
}: UserSettingsScreenProps) {
  return (
    <AppScreen>
      {tutorialAvailable && (onStartTutorial || onEnterPracticeMode) && (
        <AppFormSection title="Tutorial & practice">
          <p className="text-xs text-brand-text-muted leading-relaxed mb-3 -mt-1">
            Walk through the app with private practice data that never goes live. Practice data is
            stored on this device and removed when you end the tutorial.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            {onStartTutorial && (
              <button type="button" onClick={onStartTutorial} className="app-button-primary !w-auto !h-10 !px-5">
                {tutorialCompleted ? 'Restart tutorial' : 'Start tutorial'}
              </button>
            )}
            {onEnterPracticeMode && tutorialCompleted && !tutorialActive && (
              <button
                type="button"
                onClick={onEnterPracticeMode}
                className="app-button-outline !w-auto !h-10 !px-5"
              >
                Practice mode
              </button>
            )}
          </div>
          {tutorialActive && (
            <p className="text-xs text-brand-primary mt-3 font-medium">
              Tutorial or practice mode is active — use End tutorial (top right) when you are done.
            </p>
          )}
        </AppFormSection>
      )}

      {currentUser.role === 'guard' && onJoinTeamWithCode && (
        <AppFormSection title="Join a crew">
          <p className="text-xs text-brand-text-muted leading-relaxed mb-3 -mt-1">
            Crew codes are only for joining an existing coordinated crew. To apply for a job on your
            own, use Apply on the job listing.
          </p>
          <TeamCodeJoinPanel onJoin={onJoinTeamWithCode} compact />
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
