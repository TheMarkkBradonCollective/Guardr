import type { SupabaseClient } from '@supabase/supabase-js';
import { isPushConfigured } from './config';
import { dispatchPushNotification } from './delivery';

export async function notifyPaymentAttention(
  db: SupabaseClient,
  options: { requestId?: string; body: string; title?: string }
): Promise<void> {
  if (!isPushConfigured()) return;

  await dispatchPushNotification(db, {
    role: 'dispatch',
    title: options.title ?? 'Payment attention',
    body: options.body,
    type: 'payment_attention',
    requestId: options.requestId,
  });
}
