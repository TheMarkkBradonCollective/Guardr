import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeJobBilling,
  DEFAULT_PLATFORM_FEE_CONFIG,
  normalizePlatformFeeConfig,
  resolvePlatformFeePerHour,
} from './platformFees';

test('normalizePlatformFeeConfig migrates tiered legacy config to flat', () => {
  const normalized = normalizePlatformFeeConfig({
    model: 'tiered',
    tiers: [
      { minHourlyRate: 0, feePerHour: 5 },
      { minHourlyRate: 50, feePerHour: 8 },
    ],
  });
  assert.equal(normalized.model, 'flat');
  assert.equal(normalized.flatFeePerHour, 5);
});

test('resolvePlatformFeePerHour supports flat and percent only', () => {
  const flat = resolvePlatformFeePerHour(40, {
    ...DEFAULT_PLATFORM_FEE_CONFIG,
    model: 'flat',
    flatFeePerHour: 6,
  });
  assert.equal(flat, 6);

  const percent = resolvePlatformFeePerHour(40, {
    ...DEFAULT_PLATFORM_FEE_CONFIG,
    model: 'percent',
    percentRate: 0.1,
  });
  assert.equal(percent, 4);
});

test('agreement fee override takes precedence over global config', () => {
  const fee = resolvePlatformFeePerHour(
    50,
    { ...DEFAULT_PLATFORM_FEE_CONFIG, model: 'flat', flatFeePerHour: 5 },
    { model: 'percent', percentRate: 0.2 }
  );
  assert.equal(fee, 10);
});

test('computeJobBilling snapshots open-contract billing', () => {
  const billing = computeJobBilling(45, 8, 2, DEFAULT_PLATFORM_FEE_CONFIG, {
    model: 'flat',
    flatFeePerHour: 7,
  });
  assert.equal(billing.platformFeePerHour, 7);
  assert.equal(billing.guardPay, 38);
  assert.equal(billing.estimatedPayout, 720);
});
