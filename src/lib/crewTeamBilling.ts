import type { PlatformSettings } from './platformSettings';
import type { JobGuardSlot } from '../types';
import { isMultiGuardJob } from './guardTeams';

export interface CrewTeamPayBumpBreakdown {
  perGuardPerHour: number;
  guardCount: number;
  durationHours: number;
  /** Total added to client bill — each crew guard earns +perGuardPerHour. */
  totalUpcost: number;
}

export function crewTeamPayBumpRate(
  settings: Pick<PlatformSettings, 'crewTeamPayBumpPerHour' | 'teamLeadBonusPerGuardPerHour'>
): number {
  return Math.max(0, settings.crewTeamPayBumpPerHour ?? settings.teamLeadBonusPerGuardPerHour ?? 1);
}

/** Guards on the crew roster that count toward the team pay bump. */
export function countCrewGuardsForBilling(
  slots: JobGuardSlot[] | undefined,
  guardsNeeded: number
): number {
  const active = (slots ?? []).filter(
    (s) =>
      s.guardId &&
      ['invited', 'pending_staff', 'crew_confirmed', 'pending_client', 'approved'].includes(s.status)
  ).length;
  if (active > 0) return active;
  return Math.max(guardsNeeded, 1);
}

export function computeCrewTeamPayBumpBreakdown(
  settings: PlatformSettings,
  slots: JobGuardSlot[] | undefined,
  guardsNeeded: number,
  durationHours: number
): CrewTeamPayBumpBreakdown {
  const perGuardPerHour = crewTeamPayBumpRate(settings);
  const guardCount = countCrewGuardsForBilling(slots, guardsNeeded);
  const totalUpcost = Math.round(perGuardPerHour * guardCount * durationHours * 100) / 100;
  return { perGuardPerHour, guardCount, durationHours, totalUpcost };
}

export function jobHasCrewTeamPayBump(
  req: Pick<{ guardsNeeded?: number }, 'guardsNeeded'>
): boolean {
  return isMultiGuardJob(req);
}

export function crewTeamUpcostLabel(breakdown: CrewTeamPayBumpBreakdown): string {
  return `$${breakdown.perGuardPerHour}/hr × ${breakdown.guardCount} guard${breakdown.guardCount === 1 ? '' : 's'} × ${breakdown.durationHours}h`;
}
