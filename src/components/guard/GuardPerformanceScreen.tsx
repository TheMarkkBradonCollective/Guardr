import React, { useState } from 'react';
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
import {
  isJobTypeMetricId,
  type JobTypeMetricId,
  type JobTypeRatingCard,
} from '../../lib/guardJobTypeRatingMetrics';
import { buildGuardContractViolations } from '../../lib/guardContractViolations';
import { PERFORMANCE_MODALITIES, workModalityLabel, type WorkModality } from '../../lib/guardWorkModality';
import { guardDrivingPerformanceVisible } from '../../lib/guardVehicle';
import { GuardRatingSection } from './GuardRatingSection';
import { GuardModalityPrioritySection } from './GuardModalityPrioritySection';
import { GuardPerformanceFactorDetail } from './GuardPerformanceFactorDetail';
import { GuardModalityMetricDetail } from './GuardModalityMetricDetail';
import {
  GuardContractViolationDetail,
  GuardContractViolationDisputeStatus,
} from './GuardContractViolationDetail';
import { GuardContractViolationsList } from './GuardContractViolationsList';
import { GuardPerformanceRewards } from './GuardPerformanceRewards';
import { AppScreen } from '../ui/app/AppPrimitives';
import { ListFilterTabs } from '../ui/ListFilterTabs';
import { useLayoutFormFactor } from '../../surfaces';
import { WorkbenchEmpty, WorkbenchFlatSplit } from '../baseui/layout/WorkbenchLayout';

export type PerformanceViewTab = 'overall' | WorkModality;

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

function visiblePerformanceModalities(guard: SecurityGuard): WorkModality[] {
  return PERFORMANCE_MODALITIES.filter(
    (modality) => modality !== 'driving' || guardDrivingPerformanceVisible(guard)
  );
}

function performanceTabOptionsForGuard(guard: SecurityGuard): { id: PerformanceViewTab; label: string }[] {
  return [
    { id: 'overall', label: 'Overall' },
    ...visiblePerformanceModalities(guard).map((modality) => ({
      id: modality,
      label: workModalityLabel(modality),
    })),
  ];
}

export function GuardPerformanceScreen({
  guard,
  requests,
  performanceFactorId = null,
  onPerformanceFactorChange,
  onDisputeShiftAuditViolation,
}: GuardPerformanceScreenProps) {
  const formFactor = useLayoutFormFactor();
  const [activeTab, setActiveTab] = useState<PerformanceViewTab>('overall');
  const performanceTabOptions = React.useMemo(
    () => performanceTabOptionsForGuard(guard),
    [guard]
  );

  React.useEffect(() => {
    if (activeTab === 'driving' && !guardDrivingPerformanceVisible(guard)) {
      setActiveTab('overall');
      setSelectedModalityMetric(null);
    }
  }, [activeTab, guard]);
  const [subview, setSubview] = useState<PerformanceSubview>('main');
  const [selectedViolationId, setSelectedViolationId] = useState<string | null>(null);
  const [selectedModalityMetric, setSelectedModalityMetric] = useState<{
    modality: WorkModality;
    metricId: JobTypeMetricId;
    card: JobTypeRatingCard;
  } | null>(null);
  const [showRewards, setShowRewards] = useState(false);

  const performance = React.useMemo(
    () => computeGuardPerformance(guard.id, requests),
    [guard.id, requests]
  );
  const skillRatings = React.useMemo(
    () => computeGuardSkillRatings(guard, requests, { includeAllJobTypes: true }),
    [guard, requests]
  );
  const contractViolations = React.useMemo(
    () => buildGuardContractViolations(guard, requests),
    [guard, requests]
  );
  const selectedViolation = React.useMemo(
    () => contractViolations.find((v) => v.id === selectedViolationId) ?? null,
    [contractViolations, selectedViolationId]
  );
  const selectedFactor = React.useMemo(() => {
    if (!performanceFactorId) return null;
    const rating = computeGuardPerformanceRating(guard, requests);
    return rating.factors.find((f) => f.id === performanceFactorId) ?? null;
  }, [guard, requests, performanceFactorId]);

  const handleTabChange = (tab: PerformanceViewTab) => {
    setActiveTab(tab);
    setSubview('main');
    setSelectedViolationId(null);
    setSelectedModalityMetric(null);
    setShowRewards(false);
    if (tab !== 'overall') {
      onPerformanceFactorChange?.(null);
    }
  };

  const openViolations = () => {
    setSubview('violations');
    setSelectedViolationId(null);
    setSelectedModalityMetric(null);
    setShowRewards(false);
    onPerformanceFactorChange?.(null);
  };

  const performanceTabs = (
    <div className="guard-tiered-screen-toolbar crew-hub-sticky-head guard-performance-toolbar px-1">
      <ListFilterTabs
        aria-label="Performance view"
        activeId={activeTab}
        onChange={(id) => handleTabChange(id as PerformanceViewTab)}
        tabs={performanceTabOptions.map((tab) => ({ id: tab.id, label: tab.label }))}
      />
    </div>
  );

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
      onViewRewards={() => {
        setShowRewards(true);
        setSubview('main');
        onPerformanceFactorChange?.(null);
      }}
      className="guard-performance-screen-card"
    />
  );

  const modalityContent =
    activeTab === 'standing' || activeTab === 'driving' ? (
      <GuardModalityPrioritySection
        guard={guard}
        requests={requests}
        modality={activeTab}
        pinnedLayout
        toolbar={performanceTabs}
        onMetricSelect={(metricId, card) => {
          if (isJobTypeMetricId(metricId)) {
            setSelectedModalityMetric({ modality: activeTab, metricId, card });
          }
        }}
        className="guard-performance-screen-card"
      />
    ) : null;

  const tabbedContent = activeTab === 'overall' ? overallContent : modalityContent;

  if (showRewards && activeTab === 'overall') {
    return (
      <AppScreen className="guard-tiered-screen h-full min-h-0">
        <GuardPerformanceRewards
          guard={guard}
          requests={requests}
          onBack={() => setShowRewards(false)}
        />
      </AppScreen>
    );
  }

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
      <WorkbenchFlatSplit
        list={tabbedContent}
        detail={
          activeTab === 'overall' &&
          performanceFactorId &&
          selectedFactor &&
          isPerformanceFactorId(performanceFactorId) ? (
            <GuardPerformanceFactorDetail
              factor={selectedFactor}
              factorId={performanceFactorId}
              guardId={guard.id}
              requests={requests}
              onBack={() => onPerformanceFactorChange?.(null)}
            />
          ) : selectedModalityMetric ? (
            <GuardModalityMetricDetail
              card={selectedModalityMetric.card}
              metricId={selectedModalityMetric.metricId}
              modality={selectedModalityMetric.modality}
              guardId={guard.id}
              requests={requests}
              onBack={() => setSelectedModalityMetric(null)}
            />
          ) : (
            <WorkbenchEmpty
              message={
                activeTab === 'overall'
                  ? 'Select a performance factor to see the breakdown'
                  : `Select a ${workModalityLabel(activeTab as WorkModality).toLowerCase()} requirement to see the breakdown`
              }
              variant="detail"
            />
          )
        }
      />
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

  if (selectedModalityMetric) {
    return (
      <AppScreen className="guard-tiered-screen h-full min-h-0">
        <GuardModalityMetricDetail
          card={selectedModalityMetric.card}
          metricId={selectedModalityMetric.metricId}
          modality={selectedModalityMetric.modality}
          guardId={guard.id}
          requests={requests}
          onBack={() => setSelectedModalityMetric(null)}
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
