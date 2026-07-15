import type { SecurityRequest } from '../types';

const NO_SHOW_GRACE_MS = 20 * 60 * 1000;

/** Job accepted but guard never clocked in after scheduled start + grace. */
export function isGuardNoShow(req: SecurityRequest, now = Date.now()): boolean {
  if (req.status !== 'accepted') return false;
  if (!req.assignedGuardId) return false;
  if (req.checkInAudit?.checkedAt) return false;
  if ((req as SecurityRequest & { noShow?: boolean }).noShow === true) return true;

  const startMs = new Date(req.startDate).getTime();
  if (Number.isNaN(startMs)) return false;
  return now >= startMs + NO_SHOW_GRACE_MS;
}

export function noShowMinutesPastStart(req: SecurityRequest, now = Date.now()): number {
  const startMs = new Date(req.startDate).getTime();
  if (Number.isNaN(startMs) || now <= startMs) return 0;
  return Math.floor((now - startMs) / 60_000);
}

export function jobsNeedingNoShowReplacement(
  requests: SecurityRequest[],
  now = Date.now()
): SecurityRequest[] {
  return requests.filter((r) => {
    if (!isGuardNoShow(r, now)) return false;
    if (r.replacementRequest?.status === 'offering' || r.replacementRequest?.status === 'filled') {
      return false;
    }
    return true;
  });
}
