import React from 'react';
import type { JobType, SecurityGuard, GuardStandingCrewMember } from '../../types';
import { GuardJobPreferencesPanel } from './GuardJobPreferencesPanel';
import { TeamCodeJoinPanel } from './TeamCodeJoinPanel';
import { AppScreen } from '../ui/app/AppPrimitives';
import { shouldOfferTeamCodeJoin } from '../../lib/guardStandingCrew';
import { Users } from 'lucide-react';

interface GuardPreferencesScreenProps {
  guard: SecurityGuard;
  standingCrewMembers?: GuardStandingCrewMember[];
  onSaveJobPreferences?: (preferences: JobType[]) => void | Promise<void>;
  onCompleteJobTypeOnboarding?: (jobType: JobType) => void | Promise<void>;
  onJoinTeamWithCode?: (code: string) => void | Promise<void>;
}

export function GuardPreferencesScreen({
  guard,
  standingCrewMembers = [],
  onSaveJobPreferences,
  onCompleteJobTypeOnboarding,
  onJoinTeamWithCode,
}: GuardPreferencesScreenProps) {
  const showTeamJoin =
    !!onJoinTeamWithCode && shouldOfferTeamCodeJoin(guard, standingCrewMembers);

  return (
    <AppScreen className="guard-preferences-screen">
      {onSaveJobPreferences && onCompleteJobTypeOnboarding && (
        <GuardJobPreferencesPanel
          guard={guard}
          onChange={onSaveJobPreferences}
          onCompleteOnboarding={onCompleteJobTypeOnboarding}
        />
      )}

      {showTeamJoin && (
        <section className="guard-pref-crew-section">
          <div className="guard-pref-crew-header">
            <div className="guard-pref-crew-icon-wrap" aria-hidden>
              <Users className="guard-pref-crew-icon" />
            </div>
            <div>
              <h3 className="guard-pref-crew-title">Join a crew</h3>
              <p className="guard-pref-crew-desc">
                Crew codes are only for joining an existing coordinated crew. To apply for a job on
                your own, use Apply on the job listing.
              </p>
            </div>
          </div>
          <TeamCodeJoinPanel onJoin={onJoinTeamWithCode} variant="preferences" />
        </section>
      )}
    </AppScreen>
  );
}
