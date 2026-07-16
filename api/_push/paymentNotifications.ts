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
  options: {
    requestId: string;
    body: string;
    location?: string;
    title?: string;
    guardsNeeded?: number;
    hourlyRate?: number;
    guardPay?: number | null;
    teamLeadId?: string | null;
    type: string;
    state?: string | null;
    startDate: string;
    endDate: string;
  }
): Promise<void> {
  const { notifyOpenJobToGuards } = await import('../../lib/push/priorityCrewNotify');
  await notifyOpenJobToGuards(db, {
    requestId: options.requestId,
    title: options.title ?? 'job',
    body: options.body,
    location: options.location,
    guardsNeeded: options.guardsNeeded,
    hourlyRate: options.hourlyRate,
    guardPay: options.guardPay,
    teamLeadId: options.teamLeadId,
    type: options.type,
    state: options.state,
    startDate: options.startDate,
    endDate: options.endDate,
  });
}
