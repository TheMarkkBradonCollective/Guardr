/**
 * Offline queue sync — flushes pending records to Supabase on reconnect.
 */

import { supabase } from '../supabase';
import {
  getPendingOfflineRecords,
  markOfflineRecordSynced,
  type OfflineRecord,
  type OfflineRecordType,
} from './offlineQueue';

export interface OfflineSyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

async function syncRecord(record: OfflineRecord): Promise<void> {
  const { type, guardId, requestId, payload } = record;

  switch (type as OfflineRecordType) {
    case 'self-audit': {
      const p = payload as { photos?: string[]; notes?: string };
      const { data: req } = await supabase.from('security_requests').select('self_audit').eq('id', requestId).maybeSingle();
      const existing = (req?.self_audit as Record<string, unknown>) ?? {};
      await supabase
        .from('security_requests')
        .update({
          self_audit: { ...existing, ...p, guardId, syncedAt: new Date().toISOString() },
        })
        .eq('id', requestId);
      break;
    }
    case 'incident-report': {
      const p = payload as { type?: string; notes?: string; photos?: string[] };
      const { data: req } = await supabase.from('security_requests').select('reports').eq('id', requestId).maybeSingle();
      const reports = Array.isArray(req?.reports) ? [...req.reports] : [];
      reports.push({
        id: record.id,
        requestId,
        guardId,
        type: p.type ?? 'incident',
        notes: p.notes ?? '',
        photos: p.photos ?? [],
        submittedAt: record.createdAt,
      });
      await supabase.from('security_requests').update({ reports }).eq('id', requestId);
      break;
    }
    case 'activity-report': {
      const p = payload as { notes?: string; photos?: string[] };
      const { data: req } = await supabase.from('security_requests').select('activity_log').eq('id', requestId).maybeSingle();
      const log = Array.isArray(req?.activity_log) ? [...req.activity_log] : [];
      log.push({
        id: record.id,
        guardId,
        notes: p.notes ?? '',
        photos: p.photos ?? [],
        at: record.createdAt,
      });
      await supabase.from('security_requests').update({ activity_log: log }).eq('id', requestId);
      break;
    }
    case 'job-snapshot': {
      await supabase.from('security_requests').update(payload as Record<string, unknown>).eq('id', requestId);
      break;
    }
    default:
      throw new Error(`Unknown offline record type: ${type}`);
  }
}

export async function flushOfflineQueue(guardId?: string): Promise<OfflineSyncResult> {
  const pending = await getPendingOfflineRecords(guardId);
  const result: OfflineSyncResult = { synced: 0, failed: 0, errors: [] };

  for (const record of pending) {
    try {
      await syncRecord(record);
      await markOfflineRecordSynced(record.id);
      result.synced++;
    } catch (err) {
      result.failed++;
      result.errors.push(`${record.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}

export function installOfflineSyncListener(guardId?: string, onFlush?: (result: OfflineSyncResult) => void): () => void {
  const handler = async () => {
    if (!navigator.onLine) return;
    const result = await flushOfflineQueue(guardId);
    if (result.synced > 0 || result.failed > 0) onFlush?.(result);
  };

  window.addEventListener('online', handler);
  void handler();
  return () => window.removeEventListener('online', handler);
}
