import { useEffect, useRef } from 'react';
import { supabase } from './supabase';
import type { AuditLogEntry } from './auditLog';

function mapAuditRow(row: Record<string, unknown>): AuditLogEntry {
  return {
    id: String(row.id),
    actorId: String(row.actor_id),
    actorEmail: String(row.actor_email),
    actorRole: String(row.actor_role),
    action: row.action as AuditLogEntry['action'],
    entityType: String(row.entity_type),
    entityId: row.entity_id ? String(row.entity_id) : undefined,
    details:
      row.details && typeof row.details === 'object'
        ? (row.details as Record<string, unknown>)
        : undefined,
    createdAt: String(row.created_at),
  };
}

/**
 * Streams new audit log rows to staff without a manual refresh.
 */
export function useAuditLogRealtime(onInsert: (entry: AuditLogEntry) => void, enabled: boolean): void {
  const onInsertRef = useRef(onInsert);
  onInsertRef.current = onInsert;

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase.channel('guardr-audit-log-realtime');

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'audit_log' },
      (payload) => {
        onInsertRef.current(mapAuditRow(payload.new as Record<string, unknown>));
      }
    );

    channel.subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn('[Guardr] Audit log realtime channel error', err);
      }
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled]);
}
