import React from 'react';
import type { JobType, SecurityGuard } from '../../types';
import { GuardJobPreferencesPanel } from './GuardJobPreferencesPanel';
import { ResponsivePage } from '../layouts/desktop/DesktopPageShell';
import { useDevice } from '../../lib/platform';
import { WorkbenchBody, WorkbenchPage, WorkbenchToolbar } from '../baseui/layout/WorkbenchLayout';

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
  const { formFactor } = useDevice();

  if (!onSaveJobPreferences || !onCompleteJobTypeOnboarding) {
    return null;
  }

  const panel = (
    <GuardJobPreferencesPanel
      guard={guard}
      onChange={onSaveJobPreferences}
      onCompleteOnboarding={onCompleteJobTypeOnboarding}
    />
  );

  if (formFactor === 'desktop') {
    return (
      <WorkbenchPage className="adm-pref-workbench">
        <WorkbenchToolbar
          eyebrow="Job alerts"
          subtitle="Turn on job types you want — complete onboarding once per type, then toggle alerts."
        />
        <WorkbenchBody>{panel}</WorkbenchBody>
      </WorkbenchPage>
    );
  }

  return (
    <ResponsivePage screenClassName="guard-tiered-screen h-full min-h-0" className="adm-page--flush">
      {panel}
    </ResponsivePage>
  );
}
