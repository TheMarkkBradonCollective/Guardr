import React, { useMemo, useState } from 'react';
import { Check, ChevronRight, Info, Shield, Truck } from 'lucide-react';
import type { SecurityGuard, SecurityRequest } from '../../types';
import { buildModalityPriorityProgress } from '../../lib/guardPremiumJobPriority';
import {
  buildModalityRatingCards,
  isJobTypeMetricId,
  type JobTypeMetricId,
  type JobTypeRatingCard,
} from '../../lib/guardJobTypeRatingMetrics';
import {
  workModalityLabel,
  workModalitySubtitle,
  type WorkModality,
} from '../../lib/guardWorkModality';
import { ModalityRewardsInfoSheet } from './ModalityRewardsInfoSheet';

export interface GuardModalityPrioritySectionProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
  modality: WorkModality;
  pinnedLayout?: boolean;
  toolbar?: React.ReactNode;
  onMetricSelect?: (metricId: JobTypeMetricId, card: JobTypeRatingCard) => void;
  className?: string;
}

const MODALITY_ICONS: Record<WorkModality, React.ComponentType<{ className?: string }>> = {
  standing: Shield,
  driving: Truck,
};

function ModalityPriorityChecks({
  targets,
  label,
}: {
  targets: Array<{ id: string; met: boolean }>;
  label: string;
}) {
  return (
    <div className="guard-premium-priority-checks" aria-label={label}>
      {targets.map((target) => (
        <span
          key={target.id}
          className={`guard-premium-priority-check ${target.met ? 'guard-premium-priority-check-met' : ''}`}
          aria-hidden
        >
          {target.met ? <Check className="guard-premium-priority-check-icon" /> : null}
        </span>
      ))}
    </div>
  );
}

function ModalityMetricCard({
  card,
  onSelect,
}: {
  card: JobTypeRatingCard;
  onSelect?: (metricId: JobTypeMetricId, card: JobTypeRatingCard) => void;
}) {
  const interactive = !!onSelect;

  const content = (
    <>
      <p className="guard-jobtype-metric-label">{card.label}</p>
      <div className="guard-jobtype-metric-value-row">
        <p className="guard-jobtype-metric-value">{card.valueDisplay}</p>
        <span
          className={`guard-jobtype-metric-check ${card.meetsTarget ? 'guard-jobtype-metric-check-ok' : 'guard-jobtype-metric-check-muted'}`}
          aria-hidden
        >
          <Check className="guard-jobtype-metric-check-icon" />
        </span>
      </div>
      <p className="guard-jobtype-metric-target">{card.targetLabel}</p>
      <span className={`guard-factor-card-status guard-factor-status-${card.status}`}>
        <span className="guard-factor-status-dot" />
        {card.statusLabel}
      </span>
      {interactive ? <ChevronRight className="guard-factor-card-chevron" aria-hidden /> : null}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        className={`guard-jobtype-metric-card guard-jobtype-metric-card-interactive guard-factor-card-${card.status}`}
        onClick={() => onSelect?.(card.id, card)}
      >
        {content}
      </button>
    );
  }

  return (
    <article className={`guard-jobtype-metric-card guard-factor-card-${card.status}`}>
      {content}
    </article>
  );
}

export function GuardModalityPrioritySection({
  guard,
  requests,
  modality,
  pinnedLayout = false,
  toolbar,
  onMetricSelect,
  className = '',
}: GuardModalityPrioritySectionProps) {
  const [rewardsInfoOpen, setRewardsInfoOpen] = useState(false);
  const displayName = workModalityLabel(modality);
  const Icon = MODALITY_ICONS[modality];

  const priorityProgress = useMemo(
    () => buildModalityPriorityProgress(modality, guard, requests),
    [modality, guard, requests]
  );
  const cards = useMemo(
    () => buildModalityRatingCards(guard.id, modality, requests),
    [guard.id, modality, requests]
  );

  const heroBlock = (
    <div className={`guard-jobtype-hero guard-jobtype-hero-premium guard-modality-hero guard-modality-hero-${modality}`}>
      <div className="guard-jobtype-hero-glow" aria-hidden />
      <div className="guard-jobtype-hero-icon-wrap" aria-hidden>
        <Icon className="guard-jobtype-hero-icon" />
      </div>
      <h2 className="guard-jobtype-hero-name">{displayName}</h2>

      <div className="guard-premium-priority-progress-row">
        <p className="guard-premium-priority-progress-label">
          {priorityProgress.isQualified
            ? priorityProgress.qualifiedLabel
            : priorityProgress.progressLabel}
        </p>
        <button
          type="button"
          className="guard-premium-priority-info-btn"
          aria-label={`How ${displayName.toLowerCase()} rewards work`}
          onClick={() => setRewardsInfoOpen(true)}
        >
          <Info className="guard-premium-priority-info-icon" aria-hidden />
        </button>
      </div>

      <ModalityPriorityChecks
        targets={priorityProgress.targets}
        label={`${displayName} priority requirements`}
      />

      <button
        type="button"
        className="guard-premium-priority-rewards-btn"
        onClick={() => setRewardsInfoOpen(true)}
      >
        View {displayName} rewards
      </button>

      <p className="guard-jobtype-hero-subtitle">
        {priorityProgress.isQualified
          ? `You are in the priority line for premium ${modality === 'standing' ? 'standing shifts' : 'driving jobs'}`
          : workModalitySubtitle(modality)}
      </p>

      <ModalityRewardsInfoSheet
        modality={modality}
        totalTargets={priorityProgress.totalCount}
        open={rewardsInfoOpen}
        onClose={() => setRewardsInfoOpen(false)}
      />
    </div>
  );

  const bodyBlock = (
    <div className="guard-rating-body">
      <section className="guard-jobtype-metrics-section">
        <div className="guard-factors-header">
          <h3 className="guard-factors-heading">{displayName} requirements</h3>
          <p className="guard-factors-subheading">
            Hit these targets to move to the front of the line for premium{' '}
            {modality === 'standing' ? 'standing shifts' : 'driving jobs'}
          </p>
        </div>
        <div className="guard-jobtype-metrics-grid">
          {cards.map((card) => (
            <ModalityMetricCard
              key={card.id}
              card={card}
              onSelect={
                onMetricSelect && isJobTypeMetricId(card.id) ? onMetricSelect : undefined
              }
            />
          ))}
        </div>
      </section>
    </div>
  );

  if (pinnedLayout) {
    return (
      <>
        <div className="guard-tiered-screen-pinned">
          <section className={`guard-rating-section guard-rating-section-tiered guard-jobtype-hero-card ${className}`}>
            {heroBlock}
          </section>
        </div>
        {toolbar}
        <div className="guard-tiered-screen-scroll">{bodyBlock}</div>
      </>
    );
  }

  return (
    <section className={`guard-rating-section guard-rating-section-tiered ${className}`}>
      {heroBlock}
      {bodyBlock}
    </section>
  );
}
