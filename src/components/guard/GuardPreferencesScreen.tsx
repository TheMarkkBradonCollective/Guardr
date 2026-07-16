import React from 'react';
import type { JobType, SecurityGuard } from '../../types';
import { GuardJobPreferencesPanel } from './GuardJobPreferencesPanel';
import { ResponsivePage } from '../layouts/desktop/DesktopPageShell';

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
    <ResponsivePage screenClassName="guard-tiered-screen h-full min-h-0" className="adm-page--flush">
      {onSaveJobPreferences && onCompleteJobTypeOnboarding ? (
        <GuardJobPreferencesPanel
          guard={guard}
          onChange={onSaveJobPreferences}
          onCompleteOnboarding={onCompleteJobTypeOnboarding}
        />
      ) : null}
    </ResponsivePage>
  );
}
