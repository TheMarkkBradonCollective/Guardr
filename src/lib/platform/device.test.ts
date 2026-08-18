import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isWideFormFactor, resolveFormFactor, BREAKPOINTS, FORM_FACTOR_BOUNDS } from './device.ts';
import { SURFACE_BOUNDS } from '../../surfaces/surfaceKind.ts';

describe('resolveFormFactor', () => {
  it('maps surface floors rather than Tailwind lg, so 1024px is still a tablet', () => {
    assert.equal(resolveFormFactor(375), 'mobile');
    assert.equal(resolveFormFactor(FORM_FACTOR_BOUNDS.tabletMin - 1), 'mobile');
    assert.equal(resolveFormFactor(FORM_FACTOR_BOUNDS.tabletMin), 'tablet');
    assert.equal(resolveFormFactor(BREAKPOINTS.lg), 'tablet');
    assert.equal(resolveFormFactor(FORM_FACTOR_BOUNDS.desktopMin - 1), 'tablet');
    assert.equal(resolveFormFactor(FORM_FACTOR_BOUNDS.desktopMin), 'desktop');
    assert.equal(resolveFormFactor(1440), 'desktop');
  });

  it('stays aligned with the surface router floors', () => {
    assert.deepEqual(FORM_FACTOR_BOUNDS, SURFACE_BOUNDS);
  });
});

describe('isWideFormFactor', () => {
  it('is true for tablet and desktop only', () => {
    assert.equal(isWideFormFactor('mobile'), false);
    assert.equal(isWideFormFactor('tablet'), true);
    assert.equal(isWideFormFactor('desktop'), true);
  });
});
