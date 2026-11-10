import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { paymentIntentDescription } from './validateClientPaymentIntent.ts';

describe('paymentIntentDescription', () => {
  it('labels job payments for webhook metadata parity', () => {
    assert.match(paymentIntentDescription('job_payment', 'Night patrol', 'job-1'), /Night patrol/);
    assert.match(paymentIntentDescription('tip', undefined, 'job-2'), /Tip/);
  });
});
