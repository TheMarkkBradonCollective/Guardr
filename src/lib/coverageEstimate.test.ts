import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  clampGuards,
  clampHours,
  COVERAGE_TIERS,
  estimateCoverage,
  formatEstimateUsd,
  formatRateRange,
  getCoverageTier,
} from './coverageEstimate.ts';

describe('coverageEstimate', () => {
  it('clamps hours and guards to allowed ranges', () => {
    assert.equal(clampHours(0), 1);
    assert.equal(clampHours(100), 24);
    assert.equal(clampHours(8), 8);
    assert.equal(clampHours(Number.NaN), 1);
    assert.equal(clampGuards(0), 1);
    assert.equal(clampGuards(50), 20);
    assert.equal(clampGuards(3), 3);
  });

  it('computes totals across hours and guards', () => {
    const est = estimateCoverage({ tierId: 'standard', hours: 8, guards: 2 });
    // standard 28–34/hr × 8h × 2 guards = 448–544
    assert.equal(est.totalLow, 448);
    assert.equal(est.totalHigh, 544);
    assert.equal(est.totalMid, 496);
    assert.equal(est.hours, 8);
    assert.equal(est.guards, 2);
  });

  it('scales with tier rate', () => {
    const standard = estimateCoverage({ tierId: 'standard', hours: 10, guards: 1 });
    const armed = estimateCoverage({ tierId: 'armed', hours: 10, guards: 1 });
    const exec = estimateCoverage({ tierId: 'executive', hours: 10, guards: 1 });
    assert.ok(armed.totalMid > standard.totalMid);
    assert.ok(exec.totalMid > armed.totalMid);
  });

  it('clamps out-of-range input inside estimate', () => {
    const est = estimateCoverage({ tierId: 'armed', hours: 999, guards: 999 });
    assert.equal(est.hours, 24);
    assert.equal(est.guards, 20);
  });

  it('falls back to the first tier for unknown ids', () => {
    // @ts-expect-error intentional invalid id
    const tier = getCoverageTier('nope');
    assert.equal(tier.id, COVERAGE_TIERS[0].id);
  });

  it('formats currency and rate ranges', () => {
    assert.equal(formatEstimateUsd(1496), '$1,496');
    assert.equal(formatRateRange(COVERAGE_TIERS[0]), '$28–$34/hr');
  });
});
