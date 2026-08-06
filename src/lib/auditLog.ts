import { supabase } from './supabase';
import type { SessionUser } from '../types';
import { shouldEmitStaffWorkAction, emitStaffWorkAction } from './staffWorkActivity';

export type AuditAction =
  | 'sign_in'
  | 'sign_out'
  | 'job_posted'
  | 'job_approved'
  | 'job_denied'
  | 'guard_approved'
  | 'guard_activated'
  | 'guard_application_revision_requested'
  | 'guard_application_revoked'
  | 'staff_approved'
  | 'staff_rejected'
  | 'client_approved'
  | 'client_application_revision_requested'
  | 'client_application_revoked'
  | 'cert_verified'
  | 'schedule_change_approved'
  | 'schedule_change_rejected'
  | 'payment_recorded'
  | 'payout_released'
  | 'trusted_status_changed'
  | 'settings_updated'
  | 'staff_compensation_payout_confirmed'
  | 'staff_compensation_base_paid'
  | 'staff_compensation_adjustments_confirmed'
  | 'staff_time_entry_adjusted'
  | 'staff_time_entry_created'
  | 'staff_time_entry_deleted'
  | 'guard_shift_time_adjusted'
  | 'city_market_updated'
  | 'staff_city_access_updated'
  | 'bulk_action'
  | 'password_changed'
  | 'compliance_alert_created';

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

const STORAGE_KEY = 'guardr_audit_log';

function loadLocal(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(entries: AuditLogEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-500)));
  } catch {
    /* ignore */
  }
}

export async function writeAuditLog(
  actor: SessionUser | null,
  action: AuditAction,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  if (!actor) return;

  if (shouldEmitStaffWorkAction(actor.role, action)) {
    emitStaffWorkAction({ action, label: action });
  }

  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action,
    entityType,
    entityId,
    details,
    createdAt: new Date().toISOString(),
  };

  const local = loadLocal();
  local.push(entry);
  saveLocal(local);

  try {
    await supabase.from('audit_log').insert({
      id: entry.id,
      actor_id: entry.actorId,
      actor_email: entry.actorEmail,
      actor_role: entry.actorRole,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      details: entry.details ?? {},
    });
  } catch {
    /* table may not exist yet */
  }
}

export async function loadAuditLog(limit = 100): Promise<AuditLogEntry[]> {
  try {
    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (data?.length) {
      return data.map((row) => ({
        id: row.id,
        actorId: row.actor_id,
        actorEmail: row.actor_email,
        actorRole: row.actor_role,
        action: row.action as AuditAction,
        entityType: row.entity_type,
        entityId: row.entity_id ?? undefined,
        details: row.details ?? undefined,
        createdAt: row.created_at,
      }));
    }
  } catch {
    /* fallback */
  }
  return loadLocal().slice(-limit).reverse();
}

const AUDIT_ACTION_LABELS: Partial<Record<AuditAction, string>> = {
  city_market_updated: 'Service Areas updated',
  staff_city_access_updated: 'Service Areas access updated',
};

export function formatAuditActionLabel(action: AuditAction | string): string {
  const label = AUDIT_ACTION_LABELS[action as AuditAction];
  if (label) return label;
  return action.replace(/_/g, ' ');
}
