import React from 'react';
import type { JobType, SecurityGuard, GuardStandingCrewMember } from '../../types';
import { GuardJobPreferencesPanel } from './GuardJobPreferencesPanel';
import { TeamCodeJoinPanel } from './TeamCodeJoinPanel';
import { AppFormSection, AppScreen } from '../ui/app/AppPrimitives';
import { shouldOfferTeamCodeJoin } from '../../lib/guardStandingCrew';

interface GuardPreferencesScreenProps {
  guard: SecurityGuard;
  standingCrewMembers?: GuardStandingCrewMember[];
  onSaveJobPreferences?: (preferences: JobType[]) => void | Promise<void>;
  onJoinTeamWithCode?: (code: string) => void | Promise<void>;
}

export function GuardPreferencesScreen({
  guard,
  standingCrewMembers = [],
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
