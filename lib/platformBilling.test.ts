import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendLedgerEventOnce,
  calculatePlatformBilling,
  createBillingAdjustment,
  createBillingSnapshot,
} from './platformBilling';

const base = {
  hourlyRate: 35,
  platformFeePerHour: 5,
  durationHours: 6,
  guardsNeeded: 2,
};

test('calculates hourly platform allocation per guard without adding a new fee', () => {
  const result = calculatePlatformBilling(base);
  assert.equal(result.grossServiceAmount, 420);
  assert.equal(result.hourlyPlatformFee, 60);
  assert.equal(result.guardCompensation, 360);
  assert.equal(result.administrativeFee, 0);
  assert.equal(result.totalClientAmount, 420);
});

test('administrative fees remain off unless enabled and explicitly accepted at matching version', () => {
  const config = {
    id: 'admin-ops',
    label: 'Administrative fee',
    enabled: true,
    model: 'flat' as const,
    amount: 8,
    basis: 'per_booking' as const,
    version: 'v2',
  };
  assert.equal(calculatePlatformBilling({
    ...base,
    administrativeFee: { config, accepted: false },
  }).administrativeFee, 0);
  assert.equal(calculatePlatformBilling({
    ...base,
    administrativeFee: {
      config,
      accepted: true,
      acceptedAt: '2026-11-09T12:00:00.000Z',
      acceptanceVersion: 'v1',
    },
  }).administrativeFee, 0);
  const accepted = calculatePlatformBilling({
    ...base,
    administrativeFee: {
      config,
      accepted: true,
      acceptedAt: '2026-11-09T12:00:00.000Z',
      acceptanceVersion: 'v2',
    },
  });
  assert.equal(accepted.administrativeFee, 8);
  assert.equal(accepted.totalClientAmount, 428);
});

test('percentage administrative fee is separately itemized and only based on service subtotal', () => {
  const result = calculatePlatformBilling({
    ...base,
    administrativeFee: {
      config: {
        id: 'admin-percent',
        label: 'Booking administration',
        enabled: true,
        model: 'percent',
        amount: 0.025,
        basis: 'per_booking',
        version: 'v1',
      },
      accepted: true,
      acceptedAt: '2026-11-09T12:00:00.000Z',
      acceptanceVersion: 'v1',
    },
  });
  assert.equal(result.administrativeFee, 10.5);
  assert.equal(result.totalClientAmount, 430.5);
  assert.equal(result.feeLines.length, 2);
});

test('snapshot preserves accepted fee version and acceptance metadata', () => {
  const snapshot = createBillingSnapshot({
    ...base,
    administrativeFee: {
      config: {
        id: 'admin-ops',
        label: 'Administrative fee',
        enabled: true,
        model: 'flat',
        amount: 8,
        basis: 'per_booking',
        version: 'v3',
      },
      accepted: true,
      acceptedAt: '2026-11-09T12:00:00.000Z',
      acceptanceVersion: 'v3',
    },
  }, { feeScheduleVersion: 'business-2026-11', capturedAt: '2026-11-09T12:00:00.000Z' });
  assert.equal(snapshot.administrativeFee, 8);
  assert.equal(snapshot.administrativeFeeAcceptance?.configVersion, 'v3');
  assert.equal(snapshot.feeScheduleVersion, 'business-2026-11');
});

test('snapshot does not add administrative fee after later acceptance is absent', () => {
  const snapshot = createBillingSnapshot(base, {
    feeScheduleVersion: 'business-2026-11',
    capturedAt: '2026-11-09T12:00:00.000Z',
  });
  assert.equal(snapshot.administrativeFee, 0);
  assert.equal(snapshot.totalClientAmount, 420);
});

test('ledger append is idempotent for duplicate provider event IDs', () => {
  const existing = [{ idempotencyKey: 'stripe:evt_123', amount: 10 }];
  const duplicate = appendLedgerEventOnce(existing, {
    idempotencyKey: 'stripe:evt_123',
    amount: 10,
  });
  assert.equal(duplicate.inserted, false);
  assert.equal(duplicate.events.length, 1);
  const next = appendLedgerEventOnce(existing, {
    idempotencyKey: 'stripe:evt_124',
    amount: 5,
  });
  assert.equal(next.inserted, true);
  assert.equal(next.events.length, 2);
});

test('adjustments are separate, signed records and cannot rewrite a job snapshot', () => {
  const adjustment = createBillingAdjustment({
    id: 'adj-1',
    jobId: 'job-1',
    kind: 'extension',
    amount: 35,
    reason: 'Client-approved one-hour extension',
    acceptedByClient: true,
    acceptedByGuard: true,
    createdAt: '2026-11-09T12:00:00.000Z',
  });
  assert.equal(adjustment.amount, 35);
  assert.equal(adjustment.currency, 'USD');
  assert.equal(adjustment.kind, 'extension');
  assert.throws(() => createBillingAdjustment({
    id: 'adj-2',
    jobId: 'job-1',
    kind: 'correction',
    amount: 0,
    reason: 'No-op',
  }));
});

test('rejects invalid fee splits rather than allowing negative guard earnings', () => {
  assert.throws(() => calculatePlatformBilling({
    ...base,
    platformFeePerHour: 40,
  }), /cannot exceed/);
});
