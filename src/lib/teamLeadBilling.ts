import type { PlatformSettings } from './platformSettings';
import type { JobGuardSlot } from '../types';
import { countClientApprovedCrew } from './guardTeams';

export interface TeamLeadBonusBreakdown {
  perGuardPerHour: number;
  crewCount: number;
  durationHours: number;
  totalBonus: number;
  clientShare: number;
  platformShare: number;
  clientSharePercent: number;
  platformSharePercent: number;
}

export function normalizeTeamLeadBonusSettings(
  settings: Pick<
    PlatformSettings,
    | 'teamLeadBonusPerGuardPerHour'
    | 'teamLeadBonusClientSharePercent'
    | 'teamLeadBonusPlatformSharePercent'
  >
): {
  perGuardPerHour: number;
  clientSharePercent: number;
  platformSharePercent: number;
} {
  const perGuardPerHour = Math.max(0, settings.teamLeadBonusPerGuardPerHour ?? 1);
  let clientSharePercent = settings.teamLeadBonusClientSharePercent ?? 50;
  let platformSharePercent = settings.teamLeadBonusPlatformSharePercent ?? 50;
  if (clientSharePercent + platformSharePercent !== 100) {
    clientSharePercent = 50;
    platformSharePercent = 50;
  }
  return { perGuardPerHour, clientSharePercent, platformSharePercent };
}

export function computeTeamLeadBonusBreakdown(
  settings: PlatformSettings,
  slots: JobGuardSlot[] | undefined,
  leadId: string | null | undefined,
  durationHours: number
): TeamLeadBonusBreakdown {
  const { perGuardPerHour, clientSharePercent, platformSharePercent } =
    normalizeTeamLeadBonusSettings(settings);
  const crewCount = countClientApprovedCrew(slots ?? [], leadId);
  const totalBonus = Math.round(perGuardPerHour * crewCount * durationHours * 100) / 100;
  const clientShare =
    Math.round(totalBonus * (clientSharePercent / 100) * 100) / 100;
  const platformShare = Math.round((totalBonus - clientShare) * 100) / 100;
  return {
    perGuardPerHour,
    crewCount,
    durationHours,
    totalBonus,
    clientShare,
    platformShare,
    clientSharePercent,
    platformSharePercent,
  };
}
