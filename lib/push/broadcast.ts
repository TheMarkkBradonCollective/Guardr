import type { SupabaseClient } from '@supabase/supabase-js';
import { sendNotificationToRole } from './delivery';
import type { PushRole } from './types';

const BROADCAST_ROLES: PushRole[] = ['guard', 'client', 'dispatch', 'admin'];

export function canSessionBroadcast(platformRole: string | undefined): boolean {
  return platformRole === 'owner' || platformRole === 'director';
}

export async function collectBroadcastRecipientIds(db: SupabaseClient): Promise<string[]> {
  const ids = new Set<string>();
  const tables = ['clients', 'staff', 'guards'] as const;
  for (const table of tables) {
    const { data, error } = await db.from(table).select('id');
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      if (row?.id) ids.add(String(row.id));
    }
  }
  return [...ids];
}

export async function persistBroadcastInbox(
  db: SupabaseClient,
  input: { title: string; body: string; url?: string; recipientIds: string[] }
): Promise<number> {
  const now = new Date().toISOString();
  const rows = input.recipientIds.map((userId) => ({
    id: `broadcast-${now}-${userId}`,
    user_id: userId,
    type: 'account_update',
    title: input.title,
    body: input.body,
    url: input.url ?? '/',
    metadata: { broadcast: true },
    created_at: now,
  }));

  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const { error } = await db.from('user_notifications').upsert(chunk);
    if (error) throw new Error(error.message);
  }
  return rows.length;
}

export async function sendPlatformBroadcast(
  db: SupabaseClient,
  input: { title: string; body: string }
): Promise<{ sent: number; failed: number; inbox: number }> {
  const title = input.title.trim() || 'Guardr';
  const body = input.body.trim();
  const payload = {
    title,
    body,
    type: 'account_update' as const,
    url: '/',
    priority: 'high' as const,
  };

  let sent = 0;
  let failed = 0;
  for (const role of BROADCAST_ROLES) {
    const result = await sendNotificationToRole(db, role, payload);
    sent += result.sent;
    failed += result.failed;
  }

  const recipientIds = await collectBroadcastRecipientIds(db);
  const inbox = await persistBroadcastInbox(db, { title, body, url: '/', recipientIds });
  return { sent, failed, inbox };
}
