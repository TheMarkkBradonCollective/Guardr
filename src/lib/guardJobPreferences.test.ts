import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  guardCanAcceptJobType,
  guardMatchesJobPreferences,
  guardWantsJobType,
  normalizeJobTypePreferences,
  preferencesHeroColorStops,
  preferencesOnboardPercent,
} from './guardJobPreferences.ts';
import { isJobTypeOnboarded } from './guardJobTypeOnboarding.ts';
import type { SecurityGuard } from '../types.ts';

describe('normalizeJobTypePreferences', () => {
  it('defaults to no enabled job types', () => {
    assert.deepEqual(normalizeJobTypePreferences(undefined), []);
    assert.deepEqual(normalizeJobTypePreferences([]), []);
  });

  it('keeps only supported job types', () => {
    assert.deepEqual(normalizeJobTypePreferences(['event-wedding', 'invalid']), ['event-wedding']);
  });
});

describe('guard job type matching', () => {
  const guard: SecurityGuard = {
    id: 'g1',
    name: 'Guard',
    email: 'g@test.com',
    jobTypePreferences: ['event-wedding'],
    jobTypeOnboarding: { 'event-wedding': '2026-01-01T00:00:00.000Z' },
    isArmed: false,
    backgroundChecked: true,
    verified: true,
    rating: 5,
    jobsCompleted: 0,
    certifications: [],
    experience: [],
  } as SecurityGuard;

  it('matches enabled preferences only', () => {
    assert.equal(guardWantsJobType(guard, 'event-wedding'), true);
    assert.equal(guardWantsJobType(guard, 'event-concert'), false);
    assert.equal(guardMatchesJobPreferences(guard, { type: 'event-wedding' }), true);
  });

  it('requires onboarding before accepting a job type', () => {
    assert.equal(isJobTypeOnboarded(guard, 'event-wedding'), true);
    assert.equal(guardCanAcceptJobType(guard, 'event-wedding'), true);
    assert.equal(guardCanAcceptJobType({ jobTypeOnboarding: {} }, 'event-wedding'), false);
  });
});

describe('preferences onboarding hero colors', () => {
  it('interpolates red at 0%, yellow at 50%, green at 100%', () => {
    const at0 = preferencesHeroColorStops(0);
    const at50 = preferencesHeroColorStops(50);
    const at100 = preferencesHeroColorStops(100);

    assert.equal(at0.mid, '#966969');
    assert.equal(at50.mid, '#ada055');
    assert.equal(at100.mid, '#5e7b61');
    assert.equal(preferencesOnboardPercent(0, 15), 0);
    assert.equal(preferencesOnboardPercent(8, 15), 53);
    assert.equal(preferencesOnboardPercent(15, 15), 100);
  });
});
