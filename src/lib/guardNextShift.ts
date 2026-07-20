import type { GuardJobView } from './guardJobView';
import { PRE_SHIFT_BRIEFING_UNLOCK_MS, shiftStartMs } from './preShiftBriefing';

type NextShiftJob = Pick<
  GuardJobView,
  'id' | 'title' | 'status' | 'assignedGuardId' | 'startDate' | 'endDate' | 'enRouteAt' | 'arrivedAt' | 'checkInAudit' | 'location' | 'address' | 'siteName'
>;

/** Soonest accepted upcoming shift for this guard (not yet on duty / complete). */
export function getGuardNextShift<T extends NextShiftJob>(
  jobs: T[],
  guardId: string,
  nowMs: number = Date.now()
): T | null {
  const upcoming = jobs
    .filter(
      (j) =>
        j.assignedGuardId === guardId &&
        j.status === 'accepted' &&
        !j.checkInAudit?.checkedAt
    )
    .sort((a, b) => shiftStartMs(a.startDate) - shiftStartMs(b.startDate));
  return upcoming[0] ?? null;
}

/** True when the next-shift card should show a live starts-in countdown (24h window). */
export function isNextShiftCountdownActive(
  startDate: string,
  nowMs: number = Date.now()
): boolean {
  const start = shiftStartMs(startDate);
  if (Number.isNaN(start)) return false;
  return nowMs >= start - PRE_SHIFT_BRIEFING_UNLOCK_MS;
}

/** Format remaining time until shift start as HH:MM:SS (floors at 00:00:00). */
export function formatShiftStartsInCountdown(
  startDate: string,
  nowMs: number = Date.now()
): string {
  const start = shiftStartMs(startDate);
  if (Number.isNaN(start)) return '00:00:00';
  const totalSec = Math.max(0, Math.ceil((start - nowMs) / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
