import {
  getNextPerformanceTier,
  PERFORMANCE_TIERS,
  type GuardPerformanceRating,
  type PerformanceTier,
} from './guardPerformance';

export interface TierRewardItem {
  id: string;
  title: string;
  description: string;
}

export interface TierRewardsSection {
  tier: PerformanceTier;
  unlocked: boolean;
  items: TierRewardItem[];
}

const TIER_REWARDS: Record<string, TierRewardItem[]> = {
  starting: [
    {
      id: 'marketplace-access',
      title: 'Marketplace access',
      description: 'Browse and apply to open Guardr jobs once your account is active.',
    },
    {
      id: 'performance-tracking',
      title: 'Performance tracking',
      description: 'Your rating factors and tier progress update as you complete shifts.',
    },
  ],
  rising: [
    {
      id: 'open-job-priority',
      title: 'Open job visibility',
      description: 'Eligible for a wider range of open marketplace shifts.',
    },
    {
      id: 'client-reviews',
      title: 'Client review boost',
      description: 'Strong factor scores help you stand out on job applications.',
    },
    {
      id: 'crew-invites',
      title: 'Crew invitations',
      description: 'Can be invited to standing crew opportunities by leads and clients.',
    },
  ],
  professional: [
    {
      id: 'priority-fill',
      title: 'Priority job matching',
      description: 'Higher placement when clients review guard applications.',
    },
    {
      id: 'trusted-path',
      title: 'Trusted guard path',
      description: 'Eligible for trusted standing and repeat-client placements.',
    },
    {
      id: 'premium-sites',
      title: 'Premium site access',
      description: 'Unlocks more high-rate and recurring site assignments.',
    },
  ],
  elite: [
    {
      id: 'top-priority',
      title: 'Top marketplace priority',
      description: 'First look on premium and urgent coverage requests.',
    },
    {
      id: 'crew-lead',
      title: 'Crew lead eligibility',
      description: 'Eligible to lead standing crews and multi-guard jobs.',
    },
    {
      id: 'max-visibility',
      title: 'Maximum client visibility',
      description: 'Featured standing in client guard selection and crew recommendations.',
    },
  ],
};

export function rewardsForTier(tierId: string): TierRewardItem[] {
  return TIER_REWARDS[tierId] ?? TIER_REWARDS.starting;
}

export function buildTierRewardsSections(currentTier: PerformanceTier): TierRewardsSection[] {
  const ordered: PerformanceTier[] = [
    { id: 'starting', name: 'Starting', level: 0, threshold: 0 },
    ...PERFORMANCE_TIERS,
  ];

  return ordered.map((tier) => ({
    tier,
    unlocked: tier.level <= currentTier.level,
    items: rewardsForTier(tier.id),
  }));
}

export function buildPerformanceRewardsSummary(rating: GuardPerformanceRating): {
  currentTier: PerformanceTier;
  nextTier: PerformanceTier | null;
  pointsToNext: number;
  sections: TierRewardsSection[];
} {
  const nextTier = getNextPerformanceTier(rating.overallRating);
  return {
    currentTier: rating.tier,
    nextTier,
    pointsToNext: rating.pointsToNextTier,
    sections: buildTierRewardsSections(rating.tier),
  };
}
