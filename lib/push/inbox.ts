import type { AppDb } from '../db/adminClient.ts';
import type { PushSendPayload } from './types';

/**
 * Rows for the recipient's in-app inbox (user_notifications) for push payloads aimed at one
 * person. The browser can only write its own inbox, so notifications for someone else are
 * stored here, on the server, after the event was authorized.
 */
export function inboxRowsForPayloads(
  payloads: PushSendPayload[],
  options: { senderId?: string; now?: Date } = {}
): Record<string, unknown>[] {
  const now = options.now ?? new Date();
  const minute = Math.floor(now.getTime() / 60_000);
  const seen = new Set<string>();
  const rows: Record<string, unknown>[] = [];
  for (const p of payloads) {
    const userId = typeof p.userId === 'string' ? p.userId.trim() : '';
    if (!userId || userId === options.senderId) continue;
    const body = (p.body ?? '').trim();
    if (!body) continue;
    // Same event for the same person within a minute is one inbox row (retries, double taps).
    const id = `evt-${p.type}-${p.requestId ?? p.ticketId ?? ''}-${userId}-${minute}`.slice(0, 200);
    if (seen.has(id)) continue;
    seen.add(id);
    rows.push({
      id,
      user_id: userId,
      type: p.type,
      title: (p.title ?? '').trim() || 'Guardr',
      body: body.slice(0, 2000),
      url: p.url ?? null,
      request_id: p.requestId ?? null,
      guard_id: p.guardId ?? null,
      ticket_id: p.ticketId ?? null,
      created_at: now.toISOString(),
    });
  }
  return rows;
}

export async function persistTargetedInbox(
  db: AppDb,
  payloads: PushSendPayload[],
  senderId?: string
): Promise<number> {
  const rows = inboxRowsForPayloads(payloads, { senderId });
  if (rows.length === 0) return 0;
  try {
    const { error } = await db.from('user_notifications').upsert(rows);
    if (error) {
      console.warn('inbox persist failed', error.message);
      return 0;
    }
    return rows.length;
  } catch (err) {
    console.warn('inbox persist failed', err instanceof Error ? err.message : err);
    return 0;
  }
}
