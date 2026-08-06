import type { AuditAction } from './auditLog';
import type { PlatformRole } from '../types';
import { isStaffRole } from './permissions';
import {
  closeStaffTimeEntry,
  createStaffActivitySession,
  getActiveStaffTimeEntry,
  type StaffTimeEntry,
} from './staffTimeTracking';

export type StaffTimeEventKind = 'presence' | 'travel' | 'work';

/** App/tab briefly hidden — resume the same session and count the gap as travel. */
export const STAFF_PRESENCE_RESUME_GRACE_MS = 2 * 60 * 1000;

/** No travel or work while the app stays open — close the session at the last counted moment. */
export const STAFF_ACTIVITY_IDLE_MS = 15 * 60 * 1000;

export const STAFF_WORK_ACTION_EVENT = 'guardr-staff-work-action';
export const STAFF_TRAVEL_ACTION_EVENT = 'guardr-staff-travel-action';

const STAFF_WORK_AUDIT_ACTIONS = new Set<AuditAction>([
  'job_posted',
  'job_approved',
  'job_denied',
  'guard_approved',
  'guard_activated',
  'guard_application_revision_requested',
  'guard_application_revoked',
  'staff_approved',
  'staff_rejected',
  'client_approved',
  'client_application_revision_requested',
  'client_application_revoked',
  'cert_verified',
  'schedule_change_approved',
  'schedule_change_rejected',
  'payment_recorded',
  'payout_released',
  'trusted_status_changed',
  'settings_updated',
  'staff_compensation_adjustments_confirmed',
  'staff_time_entry_adjusted',
  'staff_time_entry_created',
  'staff_time_entry_deleted',
  'city_market_updated',
  'staff_city_access_updated',
  'bulk_action',
  'compliance_alert_created',
]);

export function isStaffWorkAuditAction(action: AuditAction): boolean {
  return STAFF_WORK_AUDIT_ACTIONS.has(action);
}

export function shouldEmitStaffWorkAction(actorRole: PlatformRole, action: AuditAction): boolean {
  return isStaffRole(actorRole) && isStaffWorkAuditAction(action);
}

export function emitStaffWorkAction(detail?: { action?: string; label?: string }): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STAFF_WORK_ACTION_EVENT, { detail }));
}

export function emitStaffTravelAction(detail?: { section?: string; label?: string }): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STAFF_TRAVEL_ACTION_EVENT, { detail }));
}

export function recordStaffTimeEvent(
  entries: StaffTimeEntry[],
  params: {
    staffId: string;
    staffName: string;
    kind: StaffTimeEventKind;
    at?: string;
  },
): { entries: StaffTimeEntry[]; changed: boolean } {
  const at = params.at ?? new Date().toISOString();
  const atMs = new Date(at).getTime();
  const active = getActiveStaffTimeEntry(entries, params.staffId);

  if (params.kind === 'presence') {
    if (!active) {
      const entry = createStaffActivitySession({
        staffId: params.staffId,
        staffName: params.staffName,
        at,
      });
      return { entries: [entry, ...entries], changed: true };
    }

    const lastAt = active.lastActivityAt ?? active.clockInAt;
    const idleMs = atMs - new Date(lastAt).getTime();
    if (idleMs > STAFF_ACTIVITY_IDLE_MS) {
      const closed = closeStaffTimeEntry(active);
      const fresh = createStaffActivitySession({
        staffId: params.staffId,
        staffName: params.staffName,
        at,
      });
      return {
        entries: [fresh, ...entries.map((entry) => (entry.id === closed.id ? closed : entry))],
        changed: true,
      };
    }

    const updated: StaffTimeEntry = { ...active, lastActivityAt: at };
    return {
      entries: entries.map((entry) => (entry.id === updated.id ? updated : entry)),
      changed: true,
    };
  }

  if (!active) {
    const entry = createStaffActivitySession({
      staffId: params.staffId,
      staffName: params.staffName,
      at,
    });
    return { entries: [entry, ...entries], changed: true };
  }

  const lastAt = active.lastActivityAt ?? active.clockInAt;
  const idleMs = atMs - new Date(lastAt).getTime();
  if (idleMs > STAFF_ACTIVITY_IDLE_MS) {
    const closed = closeStaffTimeEntry(active);
    const fresh = createStaffActivitySession({
      staffId: params.staffId,
      staffName: params.staffName,
      at,
    });
    return {
      entries: [fresh, ...entries.map((entry) => (entry.id === closed.id ? closed : entry))],
      changed: true,
    };
  }

  const updated: StaffTimeEntry = { ...active, lastActivityAt: at };
  return {
    entries: entries.map((entry) => (entry.id === updated.id ? updated : entry)),
    changed: true,
  };
}

/** App/tab hidden — freeze counted time at the moment the app left the foreground. */
export function markStaffPresenceHidden(
  entries: StaffTimeEntry[],
  staffId: string,
  hiddenAt?: string,
): { entries: StaffTimeEntry[]; changed: boolean } {
  const active = getActiveStaffTimeEntry(entries, staffId);
  if (!active) return { entries, changed: false };
  const at = hiddenAt ?? new Date().toISOString();
  const updated: StaffTimeEntry = { ...active, lastActivityAt: at };
  return {
    entries: entries.map((entry) => (entry.id === updated.id ? updated : entry)),
    changed: true,
  };
}

/** Brief return while still inside the resume grace window — backfill travel through the hidden gap. */
export function resumeStaffPresence(
  entries: StaffTimeEntry[],
  staffId: string,
  resumedAt?: string,
): { entries: StaffTimeEntry[]; changed: boolean } {
  const active = getActiveStaffTimeEntry(entries, staffId);
  if (!active) return { entries, changed: false };
  const at = resumedAt ?? new Date().toISOString();
  const updated: StaffTimeEntry = { ...active, lastActivityAt: at, clockOutAt: undefined };
  return {
    entries: entries.map((entry) => (entry.id === updated.id ? updated : entry)),
    changed: true,
  };
}

export function finalizeIdleStaffSessions(
  entries: StaffTimeEntry[],
  now: Date = new Date(),
): { entries: StaffTimeEntry[]; changed: boolean } {
  let changed = false;
  const next = entries.map((entry) => {
    if (entry.clockOutAt) return entry;
    const lastAt = entry.lastActivityAt ?? entry.clockInAt;
    if (now.getTime() - new Date(lastAt).getTime() >= STAFF_ACTIVITY_IDLE_MS) {
      changed = true;
      return closeStaffTimeEntry(entry);
    }
    return entry;
  });
  return { entries: next, changed };
}

export function closeActiveStaffSession(
  entries: StaffTimeEntry[],
  staffId: string,
  clockOutAt?: string,
): { entries: StaffTimeEntry[]; changed: boolean } {
  const active = getActiveStaffTimeEntry(entries, staffId);
  if (!active) return { entries, changed: false };
  const closed = closeStaffTimeEntry(active, clockOutAt ?? active.lastActivityAt);
  return {
    entries: entries.map((entry) => (entry.id === closed.id ? closed : entry)),
    changed: true,
  };
}
