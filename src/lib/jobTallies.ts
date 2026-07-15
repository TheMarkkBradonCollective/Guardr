import type { SecurityRequest } from '../types';
import { isGuardNoShow } from './noShowDetection';

/** Job missed coverage: no-show, call-off, or guard failed to check in. */
export function isJobMissed(
  req: SecurityRequest,
  options?: { guardId?: string; now?: number }
): boolean {
  if (req.noShow === true) return true;

  const reason = req.replacementRequest?.reason;
  if (reason === 'no-show' || reason === 'call-off') return true;

  if (options?.guardId) {
    const isAssigned =
      req.assignedGuardId === options.guardId ||
      (req.guardSlots ?? []).some((slot) => slot.guardId === options.guardId);
    if (isAssigned && isGuardNoShow(req, options.now)) return true;
  }

  return false;
}

export function splitCompletedAndMissed(
  jobs: SecurityRequest[],
  options?: { guardId?: string; now?: number }
): { completed: SecurityRequest[]; missed: SecurityRequest[] } {
  const completed: SecurityRequest[] = [];
  const missed: SecurityRequest[] = [];

  for (const job of jobs) {
    if (isJobMissed(job, options)) missed.push(job);
    else completed.push(job);
  }

  return { completed, missed };
}

export const JOB_TALLY_LABELS = {
  available: 'Available',
  open: 'Open',
  scheduled: 'Scheduled',
  completed: 'Completed',
  missed: 'Missed',
} as const;
