import React, { useEffect, useMemo, useState } from 'react';
import type { JobType, SecurityGuard, SecurityRequest } from '../../types';
import {
  computeGuardPerformance,
  computeGuardPerformanceRating,
  computeGuardSkillRatings,
} from '../../lib/guardPerformance';
import {
  isPerformanceFactorId,
  type PerformanceFactorId,
} from '../../lib/guardPerformanceFactorDetail';
import {
  jobTypePreferenceLabel,
  normalizeJobTypePreferences,
} from '../../lib/guardJobPreferences';
import { GuardRatingSection } from './GuardRatingSection';
import { GuardJobTypeRatingSection } from './GuardJobTypeRatingSection';
import { GuardShiftAuditDisputes } from './GuardShiftAuditDisputes';
import { AppScreen, AppSegmentedControl } from '../ui/app/AppPrimitives';
import { useDevice } from '../../lib/platform';

export type PerformanceViewTab = 'overall' | JobType;

interface GuardPerformanceScreenProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
  performanceFactorId?: PerformanceFactorId | null;
  onPerformanceFactorChange?: (factorId: PerformanceFactorId | null) => void;
  onDisputeShiftAuditViolation?: (
    requestId: string,
    violationId: string,
    note: string
  ) => void | Promise<void>;
}

function performanceTabLabel(tab: PerformanceViewTab): string {
  if (tab === 'overall') return 'Overall';
  return jobTypePreferenceLabel(tab);
}

export function GuardPerformanceScreen({
  guard,
  requests,
  performanceFactorId = null,
  onPerformanceFactorChange,
  onDisputeShiftAuditViolation,
}: GuardPerformanceScreenProps) {
  const { formFactor } = useDevice();
  const [activeTab, setActiveTab] = useState<PerformanceViewTab>('overall');

  const enabledJobTypes = useMemo(
    () => normalizeJobTypePreferences(guard.jobTypePreferences),
    [guard.jobTypePreferences]
  );

  useEffect(() => {
    if (activeTab !== 'overall' && !enabledJobTypes.includes(activeTab)) {
      setActiveTab('overall');
    }
  }, [activeTab, enabledJobTypes]);

  const tabOptions = useMemo(
    () => [
      { id: 'overall' as const, label: 'Overall' },
      ...enabledJobTypes.map((jobType) => ({
        id: jobType,
        label: performanceTabLabel(jobType),
      })),
    ],
    [enabledJobTypes]
  );

  const performance = useMemo(
    () => computeGuardPerformance(guard.id, requests),
    [guard.id, requests]
  );
  const skillRatings = useMemo(
    () => computeGuardSkillRatings(guard, requests, { includeAllJobTypes: true }),
    [guard, requests]
  );
  const skillByJobType = useMemo(
    () => new Map(skillRatings.map((skill) => [skill.jobType, skill])),
    [skillRatings]
  );
  const selectedFactor = useMemo(() => {
    if (!performanceFactorId) return null;
    const rating = computeGuardPerformanceRating(guard, requests);
    return rating.factors.find((f) => f.id === performanceFactorId) ?? null;
  }, [guard, requests, performanceFactorId]);

  const handleTabChange = (tab: PerformanceViewTab) => {
    setActiveTab(tab);
    if (tab !== 'overall') {
      onPerformanceFactorChange?.(null);
    }
  };

  const performanceTabs =
    tabOptions.length > 1 ? (
      <div className="guard-tiered-screen-toolbar crew-hub-sticky-head guard-performance-toolbar">
        <AppSegmentedControl<PerformanceViewTab>
          options={tabOptions}
          value={activeTab}
          onChange={handleTabChange}
        />
      </div>
    ) : null;

  const overallContent = (
    <>
      <GuardRatingSection
        guard={guard}
        requests={requests}
        performance={performance}
        skillRatings={skillRatings}
        variant="full"
        pinnedLayout
        toolbar={performanceTabs}
        onFactorSelect={(factor) => {
          if (isPerformanceFactorId(factor.id)) {
            onPerformanceFactorChange?.(factor.id);
          }
        }}
        className="guard-performance-screen-card"
      />
      <GuardShiftAuditDisputes
        guardId={guard.id}
        requests={requests}
        onDispute={onDisputeShiftAuditViolation}
      />
    </>
  );

  const jobTypeContent =
    activeTab !== 'overall' ? (
      <GuardJobTypeRatingSection
        guard={guard}
        requests={requests}
        jobType={activeTab}
        skillRating={skillByJobType.get(activeTab)}
        pinnedLayout
        toolbar={performanceTabs}
        className="guard-performance-screen-card"
      />
    ) : null;

  const tabbedContent = activeTab === 'overall' ? overallContent : jobTypeContent;

  if (formFactor === 'desktop') {
    return (
      <div className="adm-workbench-split adm-workbench-split--performance">
        <div className="adm-workbench-list adm-workbench-list--flat">
          {tabbedContent}
        </div>
        <div className="adm-workbench-detail">
          {activeTab === 'overall' &&
          performanceFactorId &&
          selectedFactor &&
          isPerformanceFactorId(performanceFactorId) ? (
            <div className="adm-workbench-detail-inner">
              <GuardPerformanceFactorDetail
                factor={selectedFactor}
                factorId={performanceFactorId}
                guardId={guard.id}
                requests={requests}
                onBack={() => onPerformanceFactorChange?.(null)}
              />
            </div>
          ) : (
            <div className="adm-empty adm-empty--detail">
              <p>
                {activeTab === 'overall'
                  ? 'Select a performance factor to see the breakdown'
                  : `Viewing ${performanceTabLabel(activeTab)} specialty ratings`}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (
    activeTab === 'overall' &&
    performanceFactorId &&
    selectedFactor &&
    isPerformanceFactorId(performanceFactorId)
  ) {
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
      {tabbedContent}
    </AppScreen>
  );
}
