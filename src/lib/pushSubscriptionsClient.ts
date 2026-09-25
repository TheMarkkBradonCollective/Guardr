import type { PushSubscriptionDto } from './push';
import { supabase } from './supabase';
import type { SessionUser } from '../types';
import { isStaffRole } from './permissions';

export type ClientPushRole = 'guard' | 'dispatch' | 'admin' | 'client';

function subscriptionId(userId: string, endpoint: string): string {
  let hash = 0;
  for (let i = 0; i < endpoint.length; i += 1) {
    hash = (hash << 5) - hash + endpoint.charCodeAt(i);
    hash |= 0;
  }
  return `push-${userId}-${Math.abs(hash)}`;
}

/** Mirrors server push role routing so native can register without guardr.co /api/push/subscribe. */
export function sessionUserToPushRole(user: SessionUser): ClientPushRole {
  if (user.role === 'client') return 'client';
  if (isStaffRole(user.role)) {
    return 'dispatch';
  }
  return 'guard';
}

export async function upsertPushSubscriptionDirect(
  user: SessionUser,
  subscription: PushSubscriptionDto,
  options?: { siteId?: string; quietHoursStart?: string; quietHoursEnd?: string; appChannel?: 'main' | 'messenger' }
): Promise<void> {
  const appChannel = options?.appChannel === 'messenger' ? 'messenger' : 'main';
  const row: Record<string, unknown> = {
    id: subscriptionId(user.id, subscription.endpoint),
    user_id: user.id,
    push_role: sessionUserToPushRole(user),
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    site_id: options?.siteId ?? null,
    quiet_hours_start: options?.quietHoursStart ?? null,
    quiet_hours_end: options?.quietHoursEnd ?? null,
    app_channel: appChannel,
    updated_at: new Date().toISOString(),
  };

  let { error } = await supabase.from('push_subscriptions').upsert(row, { onConflict: 'endpoint' });
  if (error && /app_channel/i.test(error.message)) {
    delete row.app_channel;
    ({ error } = await supabase.from('push_subscriptions').upsert(row, { onConflict: 'endpoint' }));
  }
  if (error) throw new Error(error.message);
}

export async function removePushSubscriptionDirect(
  user: SessionUser,
  endpoint?: string
): Promise<void> {
  let query = supabase.from('push_subscriptions').delete().eq('user_id', user.id);
  if (endpoint) query = query.eq('endpoint', endpoint);
  const { error } = await query;
  if (error) throw new Error(error.message);
}
