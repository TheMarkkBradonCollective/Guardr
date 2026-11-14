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
              return { data: { payment_status: 'unpaid', status: 'open', duration_hours: 5, hourly_rate: 50, guards_needed: 1 }, error: null };
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

  it('refuses an amount that does not match the stored job price', async () => {
    const stripe = { checkout: { sessions: { create: async () => ({ id: 'cs_x', url: 'u' }) } } } as unknown as Stripe;
    const db = {
      from(table: string) {
        const chain = {
          select: () => chain,
          eq: () => chain,
          async maybeSingle() {
            if (table === 'security_requests') {
              return { data: { payment_status: 'unpaid', status: 'open', duration_hours: 4, hourly_rate: 40, guards_needed: 1 }, error: null };
            }
            return { data: null, error: null };
          },
          insert: () => Promise.resolve({ data: null, error: null }),
        };
        return chain;
      },
    } as unknown as AppDb;
    const result = await createBookingCheckoutSession(stripe, db, {
      jobId: 'job-1', clientEmail: 'c@example.com', amountCents: 50,
    });
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.status, 400);
  });
});
