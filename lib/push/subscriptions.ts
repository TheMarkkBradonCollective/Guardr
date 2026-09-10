import type { SupabaseClient } from '@supabase/supabase-js';
import type { PushRole, PushSubscriptionPayload } from './types';
import { parsePushAppChannel, type PushAppChannel } from './channel';

function subscriptionId(userId: string, endpoint: string): string {
  let hash = 0;
  for (let i = 0; i < endpoint.length; i += 1) {
    hash = (hash << 5) - hash + endpoint.charCodeAt(i);
    hash |= 0;
  }
  return `push-${userId}-${Math.abs(hash)}`;
}

export async function upsertPushSubscription(
  db: SupabaseClient,
  params: {
    userId: string;
    pushRole: PushRole;
    subscription: PushSubscriptionPayload;
    siteId?: string;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    appChannel?: PushAppChannel;
  }
): Promise<void> {
  const appChannel = parsePushAppChannel(params.appChannel);
  const row: Record<string, unknown> = {
    id: subscriptionId(params.userId, params.subscription.endpoint),
    user_id: params.userId,
    push_role: params.pushRole,
    endpoint: params.subscription.endpoint,
    p256dh: params.subscription.keys.p256dh,
    auth: params.subscription.keys.auth,
    site_id: params.siteId ?? null,
    quiet_hours_start: params.quietHoursStart ?? null,
    quiet_hours_end: params.quietHoursEnd ?? null,
    app_channel: appChannel,
    updated_at: new Date().toISOString(),
  };

  let { error } = await db.from('push_subscriptions').upsert(row, { onConflict: 'endpoint' });
  if (error && /app_channel/i.test(error.message)) {
    delete row.app_channel;
    ({ error } = await db.from('push_subscriptions').upsert(row, { onConflict: 'endpoint' }));
  }

  if (error) {
    if (error.message.includes('push_subscriptions') || error.code === '42P01') {
      throw new Error(
        'push_subscriptions table is missing. Run supabase/complete_schema_setup.sql in the Supabase SQL Editor'
      );
    }
    throw new Error(error.message);
  }
}

export async function removePushSubscription(
  db: SupabaseClient,
  userId: string,
  endpoint?: string
): Promise<void> {
  let query = db.from('push_subscriptions').delete().eq('user_id', userId);
  if (endpoint) query = query.eq('endpoint', endpoint);
  const { error } = await query;
  if (error) throw new Error(error.message);
}
