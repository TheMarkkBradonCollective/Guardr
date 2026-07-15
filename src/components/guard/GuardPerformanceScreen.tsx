import React, { useMemo } from 'react';
import type { SecurityGuard, SecurityRequest } from '../../types';
import {
  computeGuardPerformance,
  computeGuardSkillRatings,
} from '../../lib/guardPerformance';
import { GuardRatingSection } from './GuardRatingSection';
import { AppFormSection, AppScreen } from '../ui/app/AppPrimitives';

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
    </AppScreen>
  );
}
