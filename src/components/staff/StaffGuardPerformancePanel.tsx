import React, { useMemo, useState } from 'react';
import type { SecurityGuard, SecurityRequest } from '../../types';
import {
  computeGuardPerformance,
  computeGuardPerformanceRating,
  computeGuardSkillRatings,
  type PerformanceFactor,
} from '../../lib/guardPerformance';
import {
  isPerformanceFactorId,
  type PerformanceFactorId,
} from '../../lib/guardPerformanceFactorDetail';
import { GuardRatingSection } from '../guard/GuardRatingSection';
import { GuardPerformanceFactorDetail } from '../guard/GuardPerformanceFactorDetail';
import { AppScreen, AppSegmentedControl } from '../ui/app/AppPrimitives';

type SpecialtySortKey = 'name' | 'rating' | 'count';
type FactorSortKey = 'name' | 'rate' | 'points';

interface StaffGuardPerformancePanelProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
  performanceFactorId?: PerformanceFactorId | null;
  onPerformanceFactorChange?: (factorId: PerformanceFactorId | null) => void;
  onOpenJob?: (jobId: string) => void;
}

export function StaffGuardPerformancePanel({
  guard,
  requests,
  performanceFactorId = null,
  onPerformanceFactorChange,
  onOpenJob,
}: StaffGuardPerformancePanelProps) {
  const [specialtySort, setSpecialtySort] = useState<SpecialtySortKey>('count');
  const [factorSort, setFactorSort] = useState<FactorSortKey>('points');

  const performance = useMemo(
    () => computeGuardPerformance(guard.id, requests),
    [guard.id, requests]
  );
  const skillRatings = useMemo(
    () => computeGuardSkillRatings(guard, requests, { includeAllJobTypes: true }),
    [guard, requests]
  );

  const sortedSkills = useMemo(() => {
    const rows = [...skillRatings];
    switch (specialtySort) {
      case 'name':
        return rows.sort((a, b) => a.skill.localeCompare(b.skill));
      case 'rating':
        return rows.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      case 'count':
      default:
        return rows.sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating);
    }
  }, [skillRatings, specialtySort]);

  const selectedFactor = useMemo(() => {
    if (!performanceFactorId) return null;
    const rating = computeGuardPerformanceRating(guard, requests);
    return rating.factors.find((f) => f.id === performanceFactorId) ?? null;
  }, [guard, requests, performanceFactorId]);

  const sortedFactors = useMemo(() => {
    const rating = computeGuardPerformanceRating(guard, requests);
    const rows = [...rating.factors];
    switch (factorSort) {
      case 'name':
        return rows.sort((a, b) => a.label.localeCompare(b.label));
      case 'rate':
        return rows.sort((a, b) => b.rate - a.rate || b.pointsEarned - a.pointsEarned);
      case 'points':
      default:
        return rows.sort((a, b) => b.pointsEarned - a.pointsEarned || b.rate - a.rate);
    }
  }, [guard, requests, factorSort]);

  if (performanceFactorId && selectedFactor && isPerformanceFactorId(performanceFactorId)) {
    return (
      <GuardPerformanceFactorDetail
        factor={selectedFactor}
        factorId={performanceFactorId}
        guardId={guard.id}
        requests={requests}
        onBack={() => onPerformanceFactorChange?.(null)}
        onOpenHistoryItem={onOpenJob}
        showHistory
      />
    );
  }

  return (
    <AppScreen className="guard-tiered-screen h-full min-h-0 staff-guard-performance-panel">
      <div className="staff-guard-performance-toolbar">
        <AppSegmentedControl<SpecialtySortKey>
          value={specialtySort}
          onChange={setSpecialtySort}
          options={[
            { id: 'count', label: 'By volume' },
            { id: 'rating', label: 'By rating' },
            { id: 'name', label: 'A–Z' },
          ]}
        />
        <AppSegmentedControl<FactorSortKey>
          value={factorSort}
          onChange={setFactorSort}
          options={[
            { id: 'points', label: 'Factor points' },
            { id: 'rate', label: 'Factor rate' },
            { id: 'name', label: 'A–Z' },
          ]}
        />
      </div>

      <GuardRatingSection
        guard={guard}
        requests={requests}
        performance={performance}
        skillRatings={sortedSkills}
        variant="full"
        pinnedLayout
        includeAllJobTypes
        factorOrder={sortedFactors.map((f) => f.id)}
        onFactorSelect={(factor: PerformanceFactor) => {
          if (isPerformanceFactorId(factor.id)) {
            onPerformanceFactorChange?.(factor.id);
          }
        }}
        className="guard-performance-screen-card"
      />
    </AppScreen>
  );
}
