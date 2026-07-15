import React, { useMemo } from 'react';
import type { SecurityGuard, SecurityRequest } from '../../types';
import {
  computeGuardPerformance,
  computeGuardPerformanceRating,
  computeGuardSkillRatings,
  formatOverallRating,
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
  const performanceRating = useMemo(
    () => computeGuardPerformanceRating(guard, requests),
    [guard, requests]
  );
  const skillRatings = useMemo(
    () => computeGuardSkillRatings(guard, requests),
    [guard, requests]
  );

  return (
    <AppScreen>
      <AppFormSection title="Your performance">
        <p className="text-xs text-brand-text-muted leading-relaxed mb-4 -mt-1">
          DoorDash-style rating with levels, factor breakdown, and tier progress. Clients see your
          tier and factors when they browse or hire.
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
        <AppMetricCell label="Level" value={performanceRating.tier.name} />
        <AppMetricCell
          label="Overall rating"
          value={performanceRating.overallRating > 0 ? formatOverallRating(performanceRating.overallRating) : '—'}
        />
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
