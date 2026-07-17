import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { uberDarkTheme, uberLightTheme, uberThemeForMode } from '../../theme/uberBaseTheme.ts';
import { motionDuration, prefersReducedMotion, MOTION_DURATION } from '../../theme/motionTokens.ts';

describe('uberBaseTheme', () => {
  it('uses stock Uber light theme accent', () => {
    assert.equal(uberLightTheme.colors.accent, '#276EF1');
  });

  it('uses stock Uber dark theme accent', () => {
    assert.equal(uberDarkTheme.colors.accent, '#335BA3');
  });

  it('resolves theme by mode without custom overrides', () => {
    assert.equal(uberThemeForMode('light').colors.accent, '#276EF1');
    assert.equal(uberThemeForMode('dark').colors.accent, '#335BA3');
  });
});

describe('motionTokens', () => {
  it('exports duration scale', () => {
    assert.equal(MOTION_DURATION.normal, 200);
    assert.equal(MOTION_DURATION.sheet, 320);
  });

  it('motionDuration returns a number', () => {
    assert.equal(typeof motionDuration(200), 'number');
  });

  it('prefersReducedMotion returns boolean', () => {
    assert.equal(typeof prefersReducedMotion(), 'boolean');
  });
});
