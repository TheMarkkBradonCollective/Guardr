import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  countOnboardingWords,
  formatOnboardingRemaining,
  jobTypeOnboardingRequiredMs,
  jobTypeOnboardingSpeechText,
  ONBOARDING_MIN_READ_SECONDS,
} from './guardJobTypeOnboarding.ts';
import type { JobType } from '../types.ts';

describe('jobTypeOnboardingSpeechText', () => {
  it('includes both briefing sections for the job type', () => {
    const text = jobTypeOnboardingSpeechText('patrol');
    assert.match(text, /Patrol/i);
    assert.match(text, /What to expect/i);
    assert.match(text, /Before accepting/i);
    assert.doesNotMatch(text, /Welcome to Guardr/i);
  });
});

describe('jobTypeOnboardingRequiredMs', () => {
  const types: JobType[] = ['patrol', 'nightclub-bar', 'other'];

  for (const type of types) {
    it(`enforces a minimum read time for ${type}`, () => {
      const requiredMs = jobTypeOnboardingRequiredMs(type);
      assert.ok(requiredMs >= ONBOARDING_MIN_READ_SECONDS * 1000);
    });
  }

  it('scales with content length', () => {
    const patrolMs = jobTypeOnboardingRequiredMs('patrol');
    const customMs = jobTypeOnboardingRequiredMs('other');
    assert.ok(customMs >= patrolMs);
  });
});

describe('countOnboardingWords', () => {
  it('counts words in trimmed text', () => {
    assert.equal(countOnboardingWords('one two three'), 3);
    assert.equal(countOnboardingWords('  one   two  '), 2);
  });
});

describe('formatOnboardingRemaining', () => {
  it('formats seconds and minutes', () => {
    assert.equal(formatOnboardingRemaining(4500), '5s');
    assert.equal(formatOnboardingRemaining(65_000), '1:05');
    assert.equal(formatOnboardingRemaining(0), '0s');
  });
});
