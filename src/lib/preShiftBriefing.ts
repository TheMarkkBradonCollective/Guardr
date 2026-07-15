import type { SecurityRequest } from '../types';

/** Guards can open the pre-shift briefing this long before start. */
export const PRE_SHIFT_BRIEFING_UNLOCK_MS = 24 * 60 * 60 * 1000;

/** “Start heading to site” unlocks this long before start. */
export const PRE_SHIFT_EN_ROUTE_UNLOCK_MS = 60 * 60 * 1000;

export type PreShiftBriefingReminderTier = '12h' | '6h' | '3h' | '1h' | '30m';

export const PRE_SHIFT_BRIEFING_REMINDER_TIERS: {
  tier: PreShiftBriefingReminderTier;
  msBeforeStart: number;
}[] = [
  { tier: '12h', msBeforeStart: 12 * 60 * 60 * 1000 },
  { tier: '6h', msBeforeStart: 6 * 60 * 60 * 1000 },
  { tier: '3h', msBeforeStart: 3 * 60 * 60 * 1000 },
  { tier: '1h', msBeforeStart: 60 * 60 * 1000 },
  { tier: '30m', msBeforeStart: 30 * 60 * 1000 },
];

type BriefingJob = Pick<
  SecurityRequest,
  'status' | 'assignedGuardId' | 'startDate' | 'enRouteAt' | 'checkInAudit'
>;

export function shiftStartMs(startDate: string): number {
  return new Date(startDate).getTime();
}

export function isPreShiftBriefingWindowOpen(
  req: BriefingJob,
  nowMs: number = Date.now()
): boolean {
  if (req.status !== 'accepted' || !req.assignedGuardId) return false;
  const start = shiftStartMs(req.startDate);
  if (Number.isNaN(start)) return false;
  return nowMs >= start - PRE_SHIFT_BRIEFING_UNLOCK_MS && nowMs < start + 15 * 60 * 1000;
}

export function canGuardStartEnRoute(
  req: BriefingJob,
  nowMs: number = Date.now()
): boolean {
  if (!isPreShiftBriefingWindowOpen(req, nowMs)) return false;
  if (req.enRouteAt || req.checkInAudit?.checkedAt) return false;
  const start = shiftStartMs(req.startDate);
  if (Number.isNaN(start)) return false;
  return nowMs >= start - PRE_SHIFT_EN_ROUTE_UNLOCK_MS;
}

export function msUntilEnRouteUnlock(startDate: string, nowMs: number = Date.now()): number {
  const start = shiftStartMs(startDate);
  if (Number.isNaN(start)) return 0;
  return Math.max(0, start - PRE_SHIFT_EN_ROUTE_UNLOCK_MS - nowMs);
}

export function activePreShiftBriefingReminderTier(
  msUntilStart: number
): PreShiftBriefingReminderTier | null {
  if (msUntilStart <= 0 || msUntilStart > PRE_SHIFT_BRIEFING_UNLOCK_MS) return null;

  for (let i = 0; i < PRE_SHIFT_BRIEFING_REMINDER_TIERS.length; i += 1) {
    const { tier, msBeforeStart } = PRE_SHIFT_BRIEFING_REMINDER_TIERS[i]!;
    const lowerBound =
      i < PRE_SHIFT_BRIEFING_REMINDER_TIERS.length - 1
        ? PRE_SHIFT_BRIEFING_REMINDER_TIERS[i + 1]!.msBeforeStart
        : 0;
    if (msUntilStart <= msBeforeStart && msUntilStart > lowerBound) {
      return tier;
    }
  }

  return null;
}

export function evaluatePreShiftBriefingReminder(
  req: BriefingJob,
  nowMs: number = Date.now()
): PreShiftBriefingReminderTier | null {
  if (req.status !== 'accepted' || !req.assignedGuardId) return null;
  if (req.enRouteAt || req.checkInAudit?.checkedAt) return null;

  const start = shiftStartMs(req.startDate);
  if (Number.isNaN(start)) return null;

  return activePreShiftBriefingReminderTier(start - nowMs);
}

export function preShiftBriefingReminderDedupKey(
  requestId: string,
  guardId: string,
  tier: PreShiftBriefingReminderTier
): string {
  return `pre_shift_briefing:${requestId}:${guardId}:${tier}`;
}

export function preShiftBriefingReminderCopy(
  tier: PreShiftBriefingReminderTier,
  jobTitle: string
): { title: string; body: string; priority: 'normal' | 'high' } {
  switch (tier) {
    case '12h':
      return {
        title: 'Shift briefing ready',
        body: `Your briefing for "${jobTitle}" is available — review site details before you head out.`,
        priority: 'normal',
      };
    case '6h':
      return {
        title: '6 hours until shift',
        body: `"${jobTitle}" starts in 6 hours. Open your shift briefing on the map.`,
        priority: 'normal',
      };
    case '3h':
      return {
        title: '3 hours until shift',
        body: `"${jobTitle}" starts in 3 hours. Review post orders and site briefing.`,
        priority: 'normal',
      };
    case '1h':
      return {
        title: '1 hour until shift',
        body: `"${jobTitle}" starts in 1 hour. Review your briefing, then start heading to site.`,
        priority: 'high',
      };
    case '30m':
      return {
        title: '30 minutes until shift',
        body: `"${jobTitle}" starts in 30 minutes. Head to site when you're ready.`,
        priority: 'high',
      };
    default:
      return {
        title: 'Shift briefing',
        body: `Review your briefing for "${jobTitle}".`,
        priority: 'normal',
      };
  }
}

export function formatCountdown(ms: number): string {
  const totalMinutes = Math.ceil(ms / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/** Accepted, assigned shifts within the 24h pre-shift briefing window. */
export function guardCanOpenPreShiftBriefing(
  req: BriefingJob & { assignedGuardId: string | null },
  guardId: string,
  nowMs: number = Date.now()
): boolean {
  if (req.status !== 'accepted' || req.assignedGuardId !== guardId) return false;
  return isPreShiftBriefingWindowOpen(req, nowMs);
}

export function enRouteBlockedMessage(req: BriefingJob, nowMs: number = Date.now()): string | null {
  if (req.enRouteAt) return 'You are already en route.';
  if (!isPreShiftBriefingWindowOpen(req, nowMs)) {
    return 'Shift briefing unlocks 24 hours before your scheduled start.';
  }
  const remaining = msUntilEnRouteUnlock(req.startDate, nowMs);
  if (remaining > 0) {
    return `Start heading unlocks in ${formatCountdown(remaining)} (1 hour before shift).`;
  }
  return null;
}
