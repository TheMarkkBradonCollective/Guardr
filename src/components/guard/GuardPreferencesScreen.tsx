import React from 'react';
import type { JobType, SecurityGuard } from '../../types';
import { GuardJobPreferencesPanel } from './GuardJobPreferencesPanel';
import { AppScreen } from '../ui/app/AppPrimitives';

interface GuardPreferencesScreenProps {
  guard: SecurityGuard;
  onSaveJobPreferences?: (preferences: JobType[]) => void | Promise<void>;
  onCompleteJobTypeOnboarding?: (jobType: JobType) => void | Promise<void>;
}

export function GuardPreferencesScreen({
  guard,
  onSaveJobPreferences,
  onCompleteJobTypeOnboarding,
}: GuardPreferencesScreenProps) {
  return (
    <AppScreen className="guard-tiered-screen h-full min-h-0">
      {onSaveJobPreferences && onCompleteJobTypeOnboarding ? (
        <GuardJobPreferencesPanel
          guard={guard}
          onChange={onSaveJobPreferences}
          onCompleteOnboarding={onCompleteJobTypeOnboarding}
        />
      ) : null}
    </AppScreen>
  );
}
