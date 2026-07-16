import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canClientLeaveTip,
  formatTipAmountCents,
  isValidTipCents,
  parseTipDollarsToCents,
} from './clientTips.ts';
import type { SecurityGuard, SecurityRequest } from '../types.ts';

function baseRequest(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    id: 'job-1',
    title: 'Event',
    type: 'event',
    status: 'completed',
    assignedGuardId: 'guard-1',
    startDate: '2026-01-01T18:00:00',
    endDate: '2026-01-01T22:00:00',
    location: 'LA',
    clientId: 'client-1',
    clientName: 'Client',
    hourlyRate: 30,
    guardPay: 25,
    durationHours: 4,
    estimatedPayout: 100,
    requiredCertifications: [],
    applicants: [],
    ...overrides,
  } as SecurityRequest;
}

const guardWithStripe = {
  id: 'guard-1',
  stripeConnectAccountId: 'acct_123',
} as SecurityGuard;

test('parseTipDollarsToCents parses dollar input', () => {
  assert.equal(parseTipDollarsToCents('5'), 500);
  assert.equal(parseTipDollarsToCents('$12.50'), 1250);
  assert.equal(parseTipDollarsToCents(''), null);
});

test('isValidTipCents enforces one dollar minimum', () => {
  assert.equal(isValidTipCents(99), false);
  assert.equal(isValidTipCents(100), true);
});

test('canClientLeaveTip requires stripe, completed job, and connect account', () => {
  assert.equal(
    canClientLeaveTip(baseRequest(), { allowStripe: true, allowCash: true }, guardWithStripe),
    true
  );
  assert.equal(
    canClientLeaveTip(baseRequest({ tipPaymentStatus: 'paid' }), { allowStripe: true, allowCash: true }, guardWithStripe),
    false
  );
  assert.equal(
    canClientLeaveTip(baseRequest(), { allowStripe: false, allowCash: true }, guardWithStripe),
    false
  );
});

test('formatTipAmountCents renders currency', () => {
  assert.equal(formatTipAmountCents(2000), '$20.00');
});
