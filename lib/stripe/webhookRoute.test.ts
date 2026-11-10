import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import handler from '../http/routes/stripe/webhook.ts';
import { resetStripeClientCache } from '../stripeClient.ts';
import { PAYMENTS_NOT_CONFIGURED_BODY } from '../stripeEnv.ts';

describe('stripe webhook route', () => {
  it('returns 503 when Stripe is not configured', async () => {
    const prevKey = process.env.STRIPE_SECRET_KEY;
    const prevWh = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    resetStripeClientCache();

    let status = 0;
    let body: unknown;
    await handler(
      { method: 'POST', headers: { 'stripe-signature': 'test' }, rawBody: '{}', query: {} },
      {
        status(code: number) {
          status = code;
          return this;
        },
        json(payload: unknown) {
          body = payload;
        },
        setHeader() {
          return this;
        },
        getHeader() {
          return undefined;
        },
        send() {},
        end() {},
      }
    );

    assert.equal(status, 503);
    assert.deepEqual(body, PAYMENTS_NOT_CONFIGURED_BODY);

    if (prevKey) process.env.STRIPE_SECRET_KEY = prevKey;
    if (prevWh) process.env.STRIPE_WEBHOOK_SECRET = prevWh;
  });
});
