import type { SecurityRequest } from '../types';

export type CheckInEscalationTier = 'none' | 'due' | 'alert' | 'staff' | 'escalate';

const HOUR_MS = 60 * 60 * 1000;
const TIER_ALERT_MS = 5 * 60 * 1000;
const TIER_STAFF_MS = 10 * 60 * 1000;
const TIER_ESCALATE_MS = 15 * 60 * 1000;

export interface CheckInEscalationSnapshot {
  dueAtMs: number;
  dueBucket: number;
  minutesOverdue: number;
  tier: CheckInEscalationTier;
}

function lastActivityIso(req: SecurityRequest): string | null {
  const checkIn = req.checkInAudit?.checkedAt;
  if (!checkIn) return null;
  const mids = req.midShiftAudits ?? [];
  const lastMid = mids.length ? mids[mids.length - 1]?.checkedAt : null;
  return lastMid ?? checkIn;
}

/** When the current hourly check-in was due (top of hour since last activity). */
export function getCheckInDueAtMs(req: SecurityRequest, now = Date.now()): number | null {
  const last = lastActivityIso(req);
  if (!last) return null;
  const anchor = new Date(last).getTime();
  if (Number.isNaN(anchor)) return null;
  return anchor + HOUR_MS;
}

export function evaluateCheckInEscalation(
  req: SecurityRequest,
  now = Date.now()
): CheckInEscalationSnapshot | null {
  if (req.status !== 'in-progress' || !req.assignedGuardId) return null;

  const dueAtMs = getCheckInDueAtMs(req, now);
  if (dueAtMs == null) return null;

  const minutesOverdue = Math.floor((now - dueAtMs) / 60_000);
  if (minutesOverdue < 0) {
    return {
      dueAtMs,
      dueBucket: Math.floor(dueAtMs / HOUR_MS),
      minutesOverdue: 0,
      tier: 'due',
    };
  }

  let tier: CheckInEscalationTier = 'due';
  if (now >= dueAtMs + TIER_ESCALATE_MS) tier = 'escalate';
  else if (now >= dueAtMs + TIER_STAFF_MS) tier = 'staff';
  else if (now >= dueAtMs + TIER_ALERT_MS) tier = 'alert';

  return {
    dueAtMs,
    dueBucket: Math.floor(dueAtMs / HOUR_MS),
    minutesOverdue,
    tier,
  };
}

export function checkInEscalationDedupKey(
  requestId: string,
  dueBucket: number,
  tier: Exclude<CheckInEscalationTier, 'none' | 'due'>
): string {
  return `checkin_esc:${requestId}:${dueBucket}:${tier}`;
}
