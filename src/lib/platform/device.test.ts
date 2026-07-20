import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isWideFormFactor, resolveFormFactor, BREAKPOINTS } from './device.ts';

describe('resolveFormFactor', () => {
  it('maps breakpoint widths to form factors', () => {
    assert.equal(resolveFormFactor(375), 'mobile');
    assert.equal(resolveFormFactor(BREAKPOINTS.md), 'tablet');
    assert.equal(resolveFormFactor(900), 'tablet');
    assert.equal(resolveFormFactor(BREAKPOINTS.lg), 'desktop');
    assert.equal(resolveFormFactor(1440), 'desktop');
  });
});

describe('isWideFormFactor', () => {
  it('is true for tablet and desktop only', () => {
    assert.equal(isWideFormFactor('mobile'), false);
    assert.equal(isWideFormFactor('tablet'), true);
    assert.equal(isWideFormFactor('desktop'), true);
  });
});
