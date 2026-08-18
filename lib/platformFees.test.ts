import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeJobBilling,
  DEFAULT_CLIENT_FEE_SCHEDULES,
  DEFAULT_PLATFORM_FEE_CONFIG,
  feeConfigFromJobSnapshot,
  feeConfigJsonWithSchedules,
  feeGuardTypeFromJobType,
  jobPlatformFeePerHour,
  normalizeClientPlatformFeeSchedules,
  normalizePlatformFeeConfig,
  parseFeeSchedulesFromFeeConfigJson,
  rebillJobFromSnapshot,
  resolveClientJobFeeConfig,
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

test('feeGuardTypeFromJobType maps patrol and event subtypes', () => {
  assert.equal(feeGuardTypeFromJobType('standing-guard'), 'standing-guard');
  assert.equal(feeGuardTypeFromJobType('patrol'), 'vehicle-patrol');
  assert.equal(feeGuardTypeFromJobType('event-wedding'), 'event');
  assert.equal(feeGuardTypeFromJobType('event-concert'), 'event');
  assert.equal(feeGuardTypeFromJobType('unknown-service'), 'other');
  assert.equal(feeGuardTypeFromJobType(undefined), 'other');
});

test('personal and business schedules keep separate default and per-type fees', () => {
  const personalStanding = resolveClientJobFeeConfig(
    DEFAULT_CLIENT_FEE_SCHEDULES,
    'personal',
    'standing-guard'
  );
  const businessStanding = resolveClientJobFeeConfig(
    DEFAULT_CLIENT_FEE_SCHEDULES,
    'business',
    'standing-guard'
  );
  assert.equal(personalStanding.flatFeePerHour, 5);
  assert.equal(businessStanding.flatFeePerHour, 6);

  const personalEp = resolveClientJobFeeConfig(
    DEFAULT_CLIENT_FEE_SCHEDULES,
    'personal',
    'bodyguard'
  );
  const businessEp = resolveClientJobFeeConfig(
    DEFAULT_CLIENT_FEE_SCHEDULES,
    'business',
    'bodyguard'
  );
  assert.equal(personalEp.flatFeePerHour, 8);
  assert.equal(businessEp.flatFeePerHour, 12);

  const personalEvent = resolveClientJobFeeConfig(
    DEFAULT_CLIENT_FEE_SCHEDULES,
    'personal',
    'event-wedding'
  );
  const businessEvent = resolveClientJobFeeConfig(
    DEFAULT_CLIENT_FEE_SCHEDULES,
    'business',
    'event-corporate'
  );
  assert.equal(personalEvent.flatFeePerHour, 6);
  assert.equal(businessEvent.flatFeePerHour, 8);
});

test('legacy fee_config without schedules clones the live fee into both accounts', () => {
  const cloned = normalizeClientPlatformFeeSchedules(undefined, {
    model: 'flat',
    flatFeePerHour: 5,
    percentRate: 0.15,
  });
  assert.equal(cloned.personal.flatFeePerHour, 5);
  assert.equal(cloned.business.flatFeePerHour, 5);
  assert.deepEqual(cloned.personal.byGuardType, {});
  assert.deepEqual(cloned.business.byGuardType, {});
});

test('rebillJobFromSnapshot keeps the frozen platform fee when live tables would differ', () => {
  const job = {
    hourlyRate: 40,
    platformFeePerHour: 12,
    guardPay: 28,
  };
  const live = resolveClientJobFeeConfig(DEFAULT_CLIENT_FEE_SCHEDULES, 'business', 'bodyguard');
  assert.equal(live.flatFeePerHour, 12);

  const rescheduled = rebillJobFromSnapshot(job, { durationHours: 10, guardsNeeded: 1 });
  assert.equal(rescheduled.platformFeePerHour, 12);
  assert.equal(rescheduled.guardPay, 28);
  assert.equal(rescheduled.hourlyRate, 40);
  assert.equal(rescheduled.estimatedPayout, 400);

  const rateEdit = rebillJobFromSnapshot(job, {
    hourlyRate: 50,
    durationHours: 8,
    guardsNeeded: 1,
  });
  assert.equal(rateEdit.platformFeePerHour, 12);
  assert.equal(rateEdit.guardPay, 38);
  assert.equal(rateEdit.estimatedPayout, 400);

  const agreed = rebillJobFromSnapshot(job, {
    hourlyRate: 50,
    durationHours: 8,
    guardsNeeded: 1,
    agreementFeeConfig: { model: 'flat', flatFeePerHour: 7 },
  });
  assert.equal(agreed.platformFeePerHour, 7);
  assert.equal(agreed.guardPay, 43);
});

test('feeConfigFromJobSnapshot ignores live personal/business schedules', () => {
  const snapshot = feeConfigFromJobSnapshot({
    hourlyRate: 40,
    platformFeePerHour: 9,
  });
  assert.equal(snapshot.model, 'flat');
  assert.equal(snapshot.flatFeePerHour, 9);
  assert.equal(jobPlatformFeePerHour({ hourlyRate: 40, platformFeePerHour: undefined }), 5);
  assert.equal(jobPlatformFeePerHour({ hourlyRate: 40, guardPay: 31 }), 9);
});

test('fee_config JSON round-trips nested personal and business schedules', () => {
  const json = feeConfigJsonWithSchedules(
    { model: 'flat', flatFeePerHour: 6, percentRate: 0.15 },
    DEFAULT_CLIENT_FEE_SCHEDULES
  );
  const parsed = parseFeeSchedulesFromFeeConfigJson(json, DEFAULT_PLATFORM_FEE_CONFIG);
  assert.ok(parsed);
  assert.equal(resolveClientJobFeeConfig(parsed, 'personal', 'armed-escort').flatFeePerHour, 8);
  assert.equal(resolveClientJobFeeConfig(parsed, 'business', 'nightclub-bar').flatFeePerHour, 8);
  assert.equal(parseFeeSchedulesFromFeeConfigJson({ model: 'flat' }, DEFAULT_PLATFORM_FEE_CONFIG), undefined);
});
