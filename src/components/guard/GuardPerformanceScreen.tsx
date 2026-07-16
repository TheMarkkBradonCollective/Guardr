import React, { useMemo } from 'react';
import type { SecurityGuard, SecurityRequest } from '../../types';
import {
  computeGuardPerformance,
  computeGuardSkillRatings,
} from '../../lib/guardPerformance';
import { GuardRatingSection } from './GuardRatingSection';
import { AppScreen } from '../ui/app/AppPrimitives';

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
    <AppScreen className="guard-tiered-screen h-full min-h-0">
      <GuardRatingSection
        guard={guard}
        requests={requests}
        performance={performance}
        skillRatings={skillRatings}
        variant="full"
        pinnedLayout
        className="guard-performance-screen-card"
      />
    </AppScreen>
  );
}
