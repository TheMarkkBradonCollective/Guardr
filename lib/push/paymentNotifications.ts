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

export async function notifyStripePaymentComplete(
  db: SupabaseClient,
  options: { requestId?: string; body: string; title?: string }
): Promise<void> {
  if (!isPushConfigured()) return;

  await dispatchPushNotification(db, {
    role: 'dispatch',
    title: options.title ?? 'Stripe payment received',
    body: options.body,
    type: 'stripe_payment_complete',
    requestId: options.requestId,
  });
}

export async function notifyJobOpenToGuards(
  db: SupabaseClient,
  options: { requestId: string; body: string; location?: string }
): Promise<void> {
  if (!isPushConfigured()) return;

  await dispatchPushNotification(db, {
    role: 'guard',
    title: 'New job on the map',
    body: options.body,
    type: 'job_open_to_guards',
    requestId: options.requestId,
    siteId: options.location,
  });
}
