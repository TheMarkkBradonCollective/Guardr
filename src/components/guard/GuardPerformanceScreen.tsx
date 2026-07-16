import React, { useMemo } from 'react';
import type { SecurityGuard, SecurityRequest } from '../../types';
import {
  computeGuardPerformance,
  computeGuardPerformanceRating,
  computeGuardSkillRatings,
} from '../../lib/guardPerformance';
import {
  isPerformanceFactorId,
  type PerformanceFactorId,
} from '../../lib/guardPerformanceFactorDetail';
import { GuardRatingSection } from './GuardRatingSection';
import { GuardPerformanceFactorDetail } from './GuardPerformanceFactorDetail';
import { AppScreen } from '../ui/app/AppPrimitives';

interface GuardPerformanceScreenProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
  performanceFactorId?: PerformanceFactorId | null;
  onPerformanceFactorChange?: (factorId: PerformanceFactorId | null) => void;
}

export function GuardPerformanceScreen({
  guard,
  requests,
  performanceFactorId = null,
  onPerformanceFactorChange,
}: GuardPerformanceScreenProps) {
  const performance = useMemo(
    () => computeGuardPerformance(guard.id, requests),
    [guard.id, requests]
  );
  const skillRatings = useMemo(
    () => computeGuardSkillRatings(guard, requests, { includeAllJobTypes: true }),
    [guard, requests]
  );
  const selectedFactor = useMemo(() => {
    if (!performanceFactorId) return null;
    const rating = computeGuardPerformanceRating(guard, requests);
    return rating.factors.find((f) => f.id === performanceFactorId) ?? null;
  }, [guard, requests, performanceFactorId]);

  if (performanceFactorId && selectedFactor && isPerformanceFactorId(performanceFactorId)) {
    return (
      <AppScreen className="guard-tiered-screen h-full min-h-0">
        <GuardPerformanceFactorDetail
          factor={selectedFactor}
          factorId={performanceFactorId}
          guardId={guard.id}
          requests={requests}
          onBack={() => onPerformanceFactorChange?.(null)}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen className="guard-tiered-screen h-full min-h-0">
      <GuardRatingSection
        guard={guard}
        requests={requests}
        performance={performance}
        skillRatings={skillRatings}
        variant="full"
        pinnedLayout
        includeAllJobTypes
        onFactorSelect={(factor) => {
          if (isPerformanceFactorId(factor.id)) {
            onPerformanceFactorChange?.(factor.id);
          }
        }}
        className="guard-performance-screen-card"
      />
    </AppScreen>
  );
}
