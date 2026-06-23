import type { SecurityRequest } from '../types';
import type { GuardJobView } from './guardJobView';

export interface ShiftBreakRecord {
  id: string;
  startedAt: string;
  endedAt?: string;
}

type BreakJob = Pick<SecurityRequest, 'breakMinutes' | 'shiftBreaks' | 'status' | 'checkInAudit'>;

export function activeShiftBreak(job: BreakJob): ShiftBreakRecord | null {
  const breaks = job.shiftBreaks ?? [];
  for (let i = breaks.length - 1; i >= 0; i -= 1) {
    if (!breaks[i].endedAt) return breaks[i];
  }
  return null;
}

export function totalBreakMinutesUsed(job: BreakJob, now = Date.now()): number {
  let total = 0;
  for (const brk of job.shiftBreaks ?? []) {
    const end = brk.endedAt ? new Date(brk.endedAt).getTime() : now;
    const start = new Date(brk.startedAt).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
      total += (end - start) / (60 * 1000);
    }
  }
  return Math.round(total);
}

export function breakMinutesRemaining(job: BreakJob, now = Date.now()): number {
  const allowed = job.breakMinutes ?? 0;
  if (allowed <= 0) return 0;
  return Math.max(0, allowed - totalBreakMinutesUsed(job, now));
}

export function canGuardStartBreak(job: BreakJob): boolean {
  if (job.status !== 'in-progress' || !job.checkInAudit?.checkedAt) return false;
  if ((job.breakMinutes ?? 0) <= 0) return false;
  if (activeShiftBreak(job)) return false;
  return breakMinutesRemaining(job) > 0;
}

export function canGuardEndBreak(job: BreakJob): boolean {
  return job.status === 'in-progress' && !!activeShiftBreak(job);
}

export function guardBreakBlockedMessage(job: GuardJobView | BreakJob): string | null {
  if ((job.breakMinutes ?? 0) <= 0) {
    return 'This job has no scheduled break time.';
  }
  if (activeShiftBreak(job)) return null;
  if (breakMinutesRemaining(job) <= 0) {
    return 'All scheduled break time has been used.';
  }
  return null;
}

export const BREAK_MINUTE_PRESETS = [0, 15, 30, 45, 60] as const;
