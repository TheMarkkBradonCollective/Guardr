import type Stripe from 'stripe';
import type { AppDb } from '../db/adminClient.ts';
import type { ClientPaymentIntentKind } from './clientPaymentKinds.ts';
import {
  paymentIntentDescription,
  pendingPaymentIdPrefix,
  validateClientPaymentIntent,
  type ValidatePaymentInput,
} from './validateClientPaymentIntent.ts';

export type CreateClientPaymentIntentInput = ValidatePaymentInput & {
  jobTitle?: string;
};

export type CreateClientPaymentIntentResult =
  | {
      ok: true;
      clientSecret: string;
      paymentIntentId: string;
    }
  | { ok: false; status: number; error: string };

export async function createClientPaymentIntent(
  stripe: Stripe,
  db: AppDb | null,
  input: CreateClientPaymentIntentInput
): Promise<CreateClientPaymentIntentResult> {
  const validation = await validateClientPaymentIntent(db, input);
  if (validation.ok === false) {
    return { ok: false, status: validation.status, error: validation.error };
  }

  const { kind, jobId, clientEmail, amountCents, jobTitle } = input;
  const checkoutType = kind === 'job_payment' ? 'job_payment' : kind;

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    receipt_email: clientEmail,
    automatic_payment_methods: { enabled: true },
    metadata: {
      job_id: jobId,
      checkout_type: checkoutType,
    },
    description: paymentIntentDescription(kind, jobTitle, jobId),
  });

  if (!intent.client_secret) {
    return { ok: false, status: 500, error: 'Stripe did not return a client secret' };
  }

  if (db) {
    const prefix = pendingPaymentIdPrefix(kind);
    await db.from('payments').insert({
      id: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      job_id: jobId,
      amount: amountCents / 100,
      stripe_payment_intent_id: intent.id,
      status: 'pending',
      payment_method: 'stripe',
    });
  }

  return {
    ok: true,
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  };
}
