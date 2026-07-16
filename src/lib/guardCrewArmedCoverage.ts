import type { SecurityGuard } from '../types';
import { computeGuardArmedStatus, type GuardArmedStatus } from './guardArmedStatus';

export interface StandingCrewArmedStats {
  total: number;
  armed: number;
  lightArmed: number;
  unarmed: number;
  armedCapable: number;
  armedCapablePercent: number;
  armedPercent: number;
  lightArmedPercent: number;
  unarmedPercent: number;
}

function countStatus(counts: Record<GuardArmedStatus, number>, status: GuardArmedStatus): void {
  counts[status] += 1;
}

export function soloArmedStatusFromStats(stats: StandingCrewArmedStats): GuardArmedStatus {
  if (stats.armed > 0) return 'armed';
  if (stats.lightArmed > 0) return 'light-armed';
  return 'unarmed';
}

/** True when the roster is just the lead — no active members yet. */
export function isLeadOnlyStandingCrew(activeMemberCount: number): boolean {
  return activeMemberCount === 0;
}

/** Armed coverage for a standing crew lead plus active roster members. */
export function computeStandingCrewArmedStats(
  lead: SecurityGuard,
  activeMemberGuardIds: string[],
  guards: SecurityGuard[],
  state = 'CA'
): StandingCrewArmedStats {
  const guardById = new Map(guards.map((g) => [g.id, g]));
  const teamGuards: SecurityGuard[] = [lead];
  for (const memberId of activeMemberGuardIds) {
    if (memberId === lead.id) continue;
    const member = guardById.get(memberId);
    if (member) teamGuards.push(member);
  }

  const counts: Record<GuardArmedStatus, number> = {
    armed: 0,
    'light-armed': 0,
    unarmed: 0,
  };

  for (const member of teamGuards) {
    countStatus(counts, computeGuardArmedStatus(member, state));
  }

  const total = teamGuards.length;
  const armed = counts.armed;
  const lightArmed = counts['light-armed'];
  const unarmed = counts.unarmed;
  const armedCapable = armed + lightArmed;

  return {
    total,
    armed,
    lightArmed,
    unarmed,
    armedCapable,
    armedCapablePercent: total > 0 ? Math.round((armedCapable / total) * 100) : 0,
    armedPercent: total > 0 ? (armed / total) * 100 : 0,
    lightArmedPercent: total > 0 ? (lightArmed / total) * 100 : 0,
    unarmedPercent: total > 0 ? (unarmed / total) * 100 : 0,
  };
}
