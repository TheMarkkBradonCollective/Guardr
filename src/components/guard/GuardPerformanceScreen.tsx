import React, { useMemo } from 'react';
import type { SecurityGuard, SecurityRequest } from '../../types';
import {
  computeGuardPerformance,
  computeGuardSkillRatings,
  formatPerformanceScore,
} from '../../lib/guardPerformance';
import { GuardRatingSection } from './GuardRatingSection';
import { AppFormSection, AppMetricStrip, AppMetricCell, AppScreen } from '../ui/app/AppPrimitives';

interface GuardPerformanceScreenProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
}

export function GuardPerformanceScreen({ guard, requests }: GuardPerformanceScreenProps) {
  const performance = useMemo(
    () => computeGuardPerformance(guard.id, requests),
    [guard.id, requests]
  );
  const skillRatings = useMemo(
    () => computeGuardSkillRatings(guard, requests),
    [guard, requests]
  );

  return (
    <AppScreen>
      <AppFormSection title="Your security rating">
        <p className="text-xs text-brand-text-muted leading-relaxed mb-4 -mt-1">
          DoorDash-style breakdown of client reviews, shift behavior, and specialty scores. Clients
          see this on your profile when they browse or hire.
        </p>
        <GuardRatingSection
          guard={guard}
          requests={requests}
          performance={performance}
          skillRatings={skillRatings}
          variant="full"
        />
      </AppFormSection>

      <AppMetricStrip className="mt-2">
        <AppMetricCell label="Client rating" value={guard.rating > 0 ? guard.rating.toFixed(1) : '—'} />
        <AppMetricCell
          label="Security score"
          value={performance.overallScore > 0 ? formatPerformanceScore(performance.overallScore) : '—'}
        />
        <AppMetricCell label="Shifts completed" value={String(guard.jobsCompleted)} />
        {guard.yearsExperience != null && guard.yearsExperience > 0 && (
          <AppMetricCell label="Experience" value={`${guard.yearsExperience}+ yrs`} />
        )}
      </AppMetricStrip>
    </AppScreen>
  );
}
