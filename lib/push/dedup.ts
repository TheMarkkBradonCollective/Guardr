import type { SupabaseClient } from '@supabase/supabase-js';
import type { PushNotificationType } from './types';

const DEDUP_TTL_MS = 25 * 60 * 60 * 1000;

export function missedCheckinDedupKey(requestId: string, hourBucket: number): string {
  return `missed_checkin:${requestId}:${hourBucket}`;
}

export function checkInEscalationDedupKey(
  requestId: string,
  dueBucket: number,
  tier: 'alert' | 'staff' | 'escalate'
): string {
  return `checkin_esc:${requestId}:${dueBucket}:${tier}`;
}

export function companyPlacardExpiryDedupKey(
  documentType: string,
  tier: string,
  expiryDate: string,
  userId: string
): string {
  return `company_placard_expiry:${documentType}:${tier}:${expiryDate}:${userId}`;
}

export function companyPlacardMissingDedupKey(
  documentType: string,
  weekBucket: number,
  userId: string
): string {
  return `company_placard_missing:${documentType}:${weekBucket}:${userId}`;
}

/**
 * Returns true when this notification was already sent for the dedup key.
 */
export async function claimNotificationDedup(
  db: SupabaseClient,
  dedupKey: string,
  notificationType: PushNotificationType
): Promise<boolean> {
  const { data: existing } = await db
    .from('push_notification_dedup')
    .select('id')
    .eq('id', dedupKey)
    .maybeSingle();

  if (existing?.id) return true;

  const { error } = await db.from('push_notification_dedup').insert({
    id: dedupKey,
    notification_type: notificationType,
  });

  if (error) {
    if (error.code === '23505') return true;
    throw new Error(error.message);
  }

  return false;
}

export async function pruneStaleNotificationDedup(db: SupabaseClient): Promise<void> {
  const cutoff = new Date(Date.now() - DEDUP_TTL_MS).toISOString();
  await db.from('push_notification_dedup').delete().lt('created_at', cutoff);
}
