import React from 'react';
import type { JobType, SecurityGuard, GuardStandingCrewMember, SessionUser } from '../../types';
import { GuardJobPreferencesPanel } from './GuardJobPreferencesPanel';
import { GuardAvailabilityCalendar } from './GuardAvailabilityCalendar';
import { TeamCodeJoinPanel } from './TeamCodeJoinPanel';
import { PushNotificationsPanel } from '../profile/PushNotificationsPanel';
import { AppFormSection, AppScreen } from '../ui/app/AppPrimitives';
import { shouldOfferTeamCodeJoin } from '../../lib/guardStandingCrew';

interface GuardPreferencesScreenProps {
  guard: SecurityGuard;
  currentUser: SessionUser;
  standingCrewMembers?: GuardStandingCrewMember[];
  isDbConnected?: boolean;
  onSaveJobPreferences?: (preferences: JobType[]) => void | Promise<void>;
  onJoinTeamWithCode?: (code: string) => void | Promise<void>;
}

export function GuardPreferencesScreen({
  guard,
  currentUser,
  standingCrewMembers = [],
  isDbConnected = false,
  onSaveJobPreferences,
  onJoinTeamWithCode,
}: GuardPreferencesScreenProps) {
  const showTeamJoin =
    !!onJoinTeamWithCode && shouldOfferTeamCodeJoin(guard, standingCrewMembers);

  return (
    <AppScreen>
      {onSaveJobPreferences && (
        <AppFormSection title="Job alerts">
          <GuardJobPreferencesPanel guard={guard} onChange={onSaveJobPreferences} />
        </AppFormSection>
      )}

      <section className="border-b border-brand-border">
        <PushNotificationsPanel currentUser={currentUser} isDbConnected={isDbConnected} />
      </section>

      <AppFormSection title="Weekly availability">
        <p className="text-xs text-brand-text-muted leading-relaxed mb-3 -mt-1">
          Let clients and matching know when you are generally available for shifts.
        </p>
        <GuardAvailabilityCalendar guardId={guard.id} />
      </AppFormSection>

      {showTeamJoin && (
        <AppFormSection title="Join a crew">
          <p className="text-xs text-brand-text-muted leading-relaxed mb-3 -mt-1">
            Crew codes are only for joining an existing coordinated crew. To apply for a job on your
            own, use Apply on the job listing.
          </p>
          <TeamCodeJoinPanel onJoin={onJoinTeamWithCode} compact />
        </AppFormSection>
      )}
    </AppScreen>
  );
}
