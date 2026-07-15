import React from 'react';
import type { GuardMatchScore } from '../../lib/guardQualificationMatching';
import { GuardArmedStatusPill } from './GuardArmedStatusPill';
import { formatPerformanceScore, computeGuardPerformance } from '../../lib/guardPerformance';
import type { SecurityRequest } from '../../types';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { Star } from 'lucide-react';

interface GuardMatchScoreRowProps {
  score: GuardMatchScore;
  rank: number;
  allRequests?: SecurityRequest[];
  action?: React.ReactNode;
}

export function GuardMatchScoreRow({ score, rank, allRequests = [], action }: GuardMatchScoreRowProps) {
  const { guard, totalScore, meetsRequirements, distanceMiles } = score;
  const performance = computeGuardPerformance(guard.id, allRequests);

  return (
    <div className="flex items-start gap-3 p-3 border border-brand-border rounded-lg bg-brand-bg-sec/40">
      <ProfileAvatar src={guard.avatar} name={guard.name} size="sm" className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-sm truncate">
            {rank === 1 ? `${guard.name} · Best match` : guard.name}
          </p>
          <span className="text-xs font-semibold text-brand-primary tabular-nums">{totalScore}% match</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <GuardArmedStatusPill guard={guard} />
          <span className="text-xs text-brand-text-muted flex items-center gap-1">
            <Star className="w-3 h-3 fill-brand-primary text-brand-primary" />
            {guard.rating.toFixed(1)}
          </span>
          {performance.overallScore > 0 && (
            <span className="text-xs text-brand-text-muted">
              Security score {formatPerformanceScore(performance.overallScore)}
            </span>
          )}
          {distanceMiles != null && (
            <span className="text-xs text-brand-text-muted">{distanceMiles.toFixed(1)} mi</span>
          )}
        </div>
        <p className={`text-xs mt-1 ${meetsRequirements ? 'text-emerald-500' : 'text-amber-500'}`}>
          {meetsRequirements ? 'Meets all job requirements' : 'Missing required credentials'}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
