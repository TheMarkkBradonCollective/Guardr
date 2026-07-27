import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  GUARD_ACTIVATION_REQUIREMENT_COUNT,
  getContinuingEducationPackageCourses,
} from './guardBsisActivationRequirements.ts';

describe('guardBsisActivationRequirements', () => {
  it('lists five activation requirements', () => {
    assert.equal(GUARD_ACTIVATION_REQUIREMENT_COUNT, 5);
  });

  it('lists nine CE package courses', () => {
    assert.equal(getContinuingEducationPackageCourses().length, 9);
  });
});
