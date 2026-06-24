import type { PlatformSettings } from './platformSettings';
import type { JobGuardSlot, SecurityRequest } from '../types';
import { computeGuardPay } from './payments';
import { coordinatedTeamStarted, isMultiGuardJob } from './guardTeams';

export interface CrewTeamPayBumpBreakdown {
  perGuardPerHour: number;
  guardCount: number;
  durationHours: number;
  /** Total added to client bill — each rostered crew guard earns +perGuardPerHour on this job. */
  totalUpcost: number;
}

const CREW_ROSTER_BILLING_STATUSES: JobGuardSlot['status'][] = [
  'invited',
  'pending_staff',
  'crew_confirmed',
  'pending_client',
  'approved',
];

export function crewTeamPayBumpRate(
  settings: Pick<PlatformSettings, 'crewTeamPayBumpPerHour' | 'teamLeadBonusPerGuardPerHour'>
): number {
  return Math.max(0, settings.crewTeamPayBumpPerHour ?? settings.teamLeadBonusPerGuardPerHour ?? 1);
}

/** Coordinated crew on this specific job — not independent multi-guard fills. */
export function jobHasCrewTeamPayBump(
  req: Pick<SecurityRequest, 'guardsNeeded' | 'teamLeadId' | 'guardSlots'>
): boolean {
  if (!isMultiGuardJob(req) || !coordinatedTeamStarted(req)) return false;
  return countCrewGuardsForBilling(req.guardSlots) > 0;
}

/** Guards on this job's coordinated crew roster (not a platform-wide team membership). */
export function countCrewGuardsForBilling(slots: JobGuardSlot[] | undefined): number {
  return (slots ?? []).filter(
    (s) => s.guardId && CREW_ROSTER_BILLING_STATUSES.includes(s.status)
  ).length;
}

export function guardQualifiesForCrewPayBumpOnJob(
  guardId: string | undefined,
  req: Pick<SecurityRequest, 'teamLeadId' | 'guardSlots'>
): boolean {
  if (!guardId || !coordinatedTeamStarted(req)) return false;
  return (req.guardSlots ?? []).some(
    (s) => s.guardId === guardId && CREW_ROSTER_BILLING_STATUSES.includes(s.status)
  );
}

export function computeCrewTeamPayBumpBreakdown(
  settings: PlatformSettings,
  req: Pick<SecurityRequest, 'guardsNeeded' | 'teamLeadId' | 'guardSlots' | 'durationHours'>
): CrewTeamPayBumpBreakdown | null {
  if (!jobHasCrewTeamPayBump(req)) return null;
  const perGuardPerHour = crewTeamPayBumpRate(settings);
  const guardCount = countCrewGuardsForBilling(req.guardSlots);
  if (guardCount <= 0) return null;
  const durationHours = req.durationHours;
  const totalUpcost = Math.round(perGuardPerHour * guardCount * durationHours * 100) / 100;
  return { perGuardPerHour, guardCount, durationHours, totalUpcost };
}

/** Guard hourly rate on this job — base pay plus crew bump only when rostered on that job's crew. */
export function effectiveGuardPayForJob(
  req: Pick<SecurityRequest, 'hourlyRate' | 'guardPay' | 'teamLeadId' | 'guardSlots'>,
  guardId: string | undefined,
  settings?: PlatformSettings
): number {
  const base = req.guardPay ?? computeGuardPay(req.hourlyRate);
  if (!settings || !guardQualifiesForCrewPayBumpOnJob(guardId, req)) return base;
  return base + crewTeamPayBumpRate(settings);
}

export function crewTeamUpcostLabel(breakdown: CrewTeamPayBumpBreakdown): string {
  return `$${breakdown.perGuardPerHour}/hr × ${breakdown.guardCount} guard${breakdown.guardCount === 1 ? '' : 's'} × ${breakdown.durationHours}h`;
}
