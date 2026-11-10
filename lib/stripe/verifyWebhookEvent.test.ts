import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type Stripe from 'stripe';
import { verifyStripeWebhookEvent } from './verifyWebhookEvent.ts';
import { PAYMENTS_NOT_CONFIGURED_BODY, isStripePaymentsConfigured } from '../stripeEnv.ts';

describe('stripeEnv', () => {
  it('reports unconfigured when secret missing', () => {
    const prev = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    assert.equal(isStripePaymentsConfigured(), false);
    assert.deepEqual(PAYMENTS_NOT_CONFIGURED_BODY, { error: 'payments not configured' });
    if (prev) process.env.STRIPE_SECRET_KEY = prev;
  });
});

describe('verifyStripeWebhookEvent', () => {
  it('surfaces signature errors from constructEventAsync', async () => {
    const stripe = {
      webhooks: {
        constructEventAsync: async () => {
          throw new Error('No signatures found');
        },
      },
    } as unknown as Stripe;

    await assert.rejects(
      () => verifyStripeWebhookEvent(stripe, Buffer.from('{}'), 'sig', 'whsec_test'),
      /No signatures found/
    );
  });
});
