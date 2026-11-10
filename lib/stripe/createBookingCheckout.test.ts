import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type Stripe from 'stripe';
import { createBookingCheckoutSession } from './createBookingCheckout.ts';
import type { AppDb } from '../db/adminClient.ts';

describe('createBookingCheckoutSession', () => {
  it('creates Checkout with job_payment metadata and pending payment row', async () => {
    let createPayload: Record<string, unknown> | undefined;
    const stripe = {
      checkout: {
        sessions: {
          create: async (payload: Record<string, unknown>) => {
            createPayload = payload;
            return { id: 'cs_test_123', url: 'https://checkout.stripe.test/pay' };
          },
        },
      },
    } as unknown as Stripe;

    const inserts: Record<string, unknown>[] = [];
    const db = {
      from(table: string) {
        const chain = {
          select() {
            return chain;
          },
          eq() {
            return chain;
          },
          async maybeSingle() {
            if (table === 'platform_settings') {
              return { data: { payment_stripe_enabled: true }, error: null };
            }
            if (table === 'security_requests') {
              return { data: { payment_status: 'unpaid', status: 'open' }, error: null };
            }
            return { data: null, error: null };
          },
          insert(row: Record<string, unknown>) {
            if (table === 'payments') inserts.push(row);
            return Promise.resolve({ data: row, error: null });
          },
        };
        return chain;
      },
    } as unknown as AppDb;

    const result = await createBookingCheckoutSession(stripe, db, {
      jobId: 'job-42',
      clientEmail: 'client@example.com',
      jobTitle: 'Retail close',
      amountCents: 25000,
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.sessionId, 'cs_test_123');
    assert.equal(inserts[0]?.status, 'pending');
    assert.equal(
      (createPayload?.metadata as Record<string, string> | undefined)?.checkout_type,
      'job_payment'
    );
  });
});
