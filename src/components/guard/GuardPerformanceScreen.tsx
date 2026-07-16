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
  getJobTypeRatingCard,
  isJobTypeMetricId,
  type JobTypeMetricId,
  type JobTypeRatingCard,
} from '../../lib/guardJobTypeRatingMetrics';
import { jobTypePreferenceLabel, normalizeJobTypePreferences } from '../../lib/guardJobPreferences';
import { buildGuardContractViolations } from '../../lib/guardContractViolations';
import { GuardRatingSection } from './GuardRatingSection';
import { GuardJobTypeRatingSection } from './GuardJobTypeRatingSection';
import { GuardJobTypeMetricDetail } from './GuardJobTypeMetricDetail';
import { GuardPerformanceFactorDetail } from './GuardPerformanceFactorDetail';
import {
  GuardContractViolationDetail,
  GuardContractViolationDisputeStatus,
} from './GuardContractViolationDetail';
import { GuardContractViolationsList } from './GuardContractViolationsList';
import { AppScreen, AppSegmentedControl } from '../ui/app/AppPrimitives';
import { useDevice } from '../../lib/platform';

export type PerformanceViewTab = 'overall' | JobType;

type PerformanceSubview =
  | 'main'
  | 'violations'
  | 'violation-detail'
  | 'violation-dispute-status';

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
  const [subview, setSubview] = useState<PerformanceSubview>('main');
  const [selectedViolationId, setSelectedViolationId] = useState<string | null>(null);
  const [selectedJobTypeMetric, setSelectedJobTypeMetric] = useState<{
    jobType: JobType;
    metricId: JobTypeMetricId;
    card: JobTypeRatingCard;
  } | null>(null);

  const enabledJobTypes = useMemo(
    () => normalizeJobTypePreferences(guard.jobTypePreferences),
    [guard.jobTypePreferences]
  );

  useEffect(() => {
    if (activeTab !== 'overall' && !enabledJobTypes.includes(activeTab)) {
      setActiveTab('overall');
      setSelectedJobTypeMetric(null);
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
  const contractViolations = useMemo(
    () => buildGuardContractViolations(guard, requests),
    [guard, requests]
  );
  const selectedViolation = useMemo(
    () => contractViolations.find((v) => v.id === selectedViolationId) ?? null,
    [contractViolations, selectedViolationId]
  );
  const selectedFactor = useMemo(() => {
    if (!performanceFactorId) return null;
    const rating = computeGuardPerformanceRating(guard, requests);
    return rating.factors.find((f) => f.id === performanceFactorId) ?? null;
  }, [guard, requests, performanceFactorId]);

  const handleTabChange = (tab: PerformanceViewTab) => {
    setActiveTab(tab);
    setSubview('main');
    setSelectedViolationId(null);
    setSelectedJobTypeMetric(null);
    if (tab !== 'overall') {
      onPerformanceFactorChange?.(null);
    }
  };

  const openViolations = () => {
    setSubview('violations');
    setSelectedViolationId(null);
    setSelectedJobTypeMetric(null);
    onPerformanceFactorChange?.(null);
  };

  const handleMetricSelect = (jobType: JobType, metricId: JobTypeMetricId, card: JobTypeRatingCard) => {
    setSelectedJobTypeMetric({ jobType, metricId, card });
    setSubview('main');
    setSelectedViolationId(null);
    onPerformanceFactorChange?.(null);
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
      onOpenViolations={openViolations}
      className="guard-performance-screen-card"
    />
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
        onMetricSelect={(metricId, card) => handleMetricSelect(activeTab, metricId, card)}
        className="guard-performance-screen-card"
      />
    ) : null;

  const tabbedContent = activeTab === 'overall' ? overallContent : jobTypeContent;

  const selectedJobTypeMetricResolved = useMemo(() => {
    if (!selectedJobTypeMetric) return null;
    const card =
      getJobTypeRatingCard(
        guard.id,
        selectedJobTypeMetric.jobType,
        selectedJobTypeMetric.metricId,
        requests
      ) ?? selectedJobTypeMetric.card;
    if (!isJobTypeMetricId(selectedJobTypeMetric.metricId)) return null;
    return {
      jobType: selectedJobTypeMetric.jobType,
      metricId: selectedJobTypeMetric.metricId,
      card,
    };
  }, [guard.id, requests, selectedJobTypeMetric]);

  const violationSubview =
    subview === 'violations' ? (
      <GuardContractViolationsList
        violations={contractViolations}
        onBack={() => setSubview('main')}
        onSelect={(violationId) => {
          setSelectedViolationId(violationId);
          setSubview('violation-detail');
        }}
      />
    ) : subview === 'violation-detail' && selectedViolation ? (
      <GuardContractViolationDetail
        violation={selectedViolation}
        onBack={() => setSubview('violations')}
        onOpenDisputeStatus={() => setSubview('violation-dispute-status')}
        onDispute={onDisputeShiftAuditViolation}
      />
    ) : subview === 'violation-dispute-status' && selectedViolation ? (
      <GuardContractViolationDisputeStatus
        violation={selectedViolation}
        onBack={() => setSubview('main')}
        onOpenDetails={() => setSubview('violation-detail')}
      />
    ) : null;

  if (violationSubview) {
    return (
      <AppScreen className="guard-tiered-screen h-full min-h-0">
        {violationSubview}
      </AppScreen>
    );
  }

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
          ) : selectedJobTypeMetricResolved ? (
            <div className="adm-workbench-detail-inner">
              <GuardJobTypeMetricDetail
                card={selectedJobTypeMetricResolved.card}
                metricId={selectedJobTypeMetricResolved.metricId}
                jobType={selectedJobTypeMetricResolved.jobType}
                guardId={guard.id}
                requests={requests}
                onBack={() => setSelectedJobTypeMetric(null)}
              />
            </div>
          ) : (
            <div className="adm-empty adm-empty--detail">
              <p>
                {activeTab === 'overall'
                  ? 'Select a performance factor to see the breakdown'
                  : `Select a ${performanceTabLabel(activeTab)} rating card to see details`}
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

  if (selectedJobTypeMetricResolved) {
    return (
      <AppScreen className="guard-tiered-screen h-full min-h-0">
        <GuardJobTypeMetricDetail
          card={selectedJobTypeMetricResolved.card}
          metricId={selectedJobTypeMetricResolved.metricId}
          jobType={selectedJobTypeMetricResolved.jobType}
          guardId={guard.id}
          requests={requests}
          onBack={() => setSelectedJobTypeMetric(null)}
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
