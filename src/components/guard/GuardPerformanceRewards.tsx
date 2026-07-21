import React, { useMemo } from 'react';
import { Award, Check, Crown, Lock, Medal, Shield } from 'lucide-react';
import type { SecurityGuard, SecurityRequest } from '../../types';
import { computeGuardPerformanceRating } from '../../lib/guardPerformance';
import { buildPerformanceRewardsSummary } from '../../lib/guardPerformanceRewards';
import { AppSubScreenHeader } from '../ui/app/AppPrimitives';

interface GuardPerformanceRewardsProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
  onBack: () => void;
}

function tierIcon(tierId: string) {
  if (tierId === 'elite') return Crown;
  if (tierId === 'professional') return Award;
  if (tierId === 'rising') return Medal;
  return Shield;
}

export function GuardPerformanceRewards({
  guard,
  requests,
  onBack,
}: GuardPerformanceRewardsProps) {
  const summary = useMemo(() => {
    const rating = computeGuardPerformanceRating(guard, requests);
    return buildPerformanceRewardsSummary(rating);
  }, [guard, requests]);

  return (
    <div className="guard-performance-rewards-screen">
      <AppSubScreenHeader title="My rewards" onBack={onBack} backLabel="Performance" />
      <div className="guard-performance-rewards-scroll">
        <section className="guard-performance-rewards-hero">
          <p className="guard-performance-rewards-eyebrow">Current level</p>
          <h2 className="guard-performance-rewards-tier">{summary.currentTier.name}</h2>
          {summary.nextTier ? (
            <p className="guard-performance-rewards-next">
              <strong>{summary.pointsToNext}</strong> points to unlock {summary.nextTier.name} rewards
            </p>
          ) : (
            <p className="guard-performance-rewards-next">You have unlocked every tier reward.</p>
          )}
        </section>

        {summary.sections.map((section) => {
          const Icon = tierIcon(section.tier.id);
          return (
            <section
              key={section.tier.id}
              className={`guard-performance-rewards-section ${section.unlocked ? 'is-unlocked' : 'is-locked'}`}
            >
              <div className="guard-performance-rewards-section-head">
                <div className="guard-performance-rewards-section-icon" aria-hidden>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3>{section.tier.name}</h3>
                  <p>{section.unlocked ? 'Unlocked' : `Unlocks at ${section.tier.threshold} points`}</p>
                </div>
                {section.unlocked ? (
                  <Check className="guard-performance-rewards-section-check" aria-hidden />
                ) : (
                  <Lock className="guard-performance-rewards-section-lock" aria-hidden />
                )}
              </div>
              <ul className="guard-performance-rewards-list">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <p className="guard-performance-rewards-item-title">{item.title}</p>
                    <p className="guard-performance-rewards-item-copy">{item.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
