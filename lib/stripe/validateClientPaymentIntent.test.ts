import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { jobPriceCents, paymentIntentDescription, validateClientPaymentIntent } from './validateClientPaymentIntent.ts';
import type { AppDb } from '../db/adminClient.ts';

describe('paymentIntentDescription', () => {
  it('labels job payments for webhook metadata parity', () => {
    assert.match(paymentIntentDescription('job_payment', 'Night patrol', 'job-1'), /Night patrol/);
    assert.match(paymentIntentDescription('tip', undefined, 'job-2'), /Tip/);
  });
});

function fakeDb(job: Record<string, unknown>): AppDb {
  return {
    from(table: string) {
      const chain = {
        select: () => chain,
        eq: () => chain,
        async maybeSingle() {
          if (table === 'security_requests') return { data: job, error: null };
          if (table === 'platform_settings') return { data: { payment_stripe_enabled: true }, error: null };
          return { data: null, error: null };
        },
      };
      return chain;
    },
  } as unknown as AppDb;
}

describe('validateClientPaymentIntent amounts', () => {
  const job = { status: 'open', payment_status: 'unpaid', duration_hours: '4.00', hourly_rate: 40, guards_needed: 2 };

  it('prices a job as hours x rate x guards', () => {
    assert.equal(jobPriceCents(job), 32000);
    assert.equal(jobPriceCents({ duration_hours: 0, hourly_rate: 40 }), 0);
  });

  it('accepts only the exact job price', async () => {
    const base = { kind: 'job_payment' as const, jobId: 'job-1', clientEmail: 'c@example.com' };
    assert.deepEqual(await validateClientPaymentIntent(fakeDb(job), { ...base, amountCents: 32000 }), { ok: true });
    const low = await validateClientPaymentIntent(fakeDb(job), { ...base, amountCents: 50 });
    assert.equal(low.ok, false);
    const unpriced = await validateClientPaymentIntent(fakeDb({ ...job, hourly_rate: 0 }), { ...base, amountCents: 50 });
    assert.equal(unpriced.ok, false);
  });

  it('requires overtime to match the stored overtime amount, even when it is missing', async () => {
    const ot = { status: 'completed', overtime_status: 'awaiting_payment', overtime_guard_approved_at: 'x', overtime_client_approved_at: 'y', overtime_amount: null };
    const r = await validateClientPaymentIntent(fakeDb(ot), { kind: 'overtime', jobId: 'job-1', clientEmail: 'c@example.com', amountCents: 5000 });
    assert.equal(r.ok, false);
  });
});
