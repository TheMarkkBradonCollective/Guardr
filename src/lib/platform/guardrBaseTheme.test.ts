import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { guardrDarkTheme, guardrLightTheme, guardrThemeForMode } from '../../theme/guardrBaseTheme.ts';
import { motionDuration, prefersReducedMotion, MOTION_DURATION } from '../../theme/motionTokens.ts';

describe('guardrBaseTheme', () => {
  it('uses black (#000) as accent in light theme', () => {
    // Real Guardr app: black primary CTA
    const accent = guardrLightTheme.colors.accent.toUpperCase().replace('#', '');
    assert.ok(
      accent === '000000' || accent === '000',
      `Expected black accent (#000000), got #${accent}`,
    );
  });

  it('uses Uber white (#FFF) as accent in dark theme', () => {
    const accent = guardrDarkTheme.colors.accent.toUpperCase().replace('#', '');
    assert.ok(
      accent === 'FFFFFF' || accent === 'FFF',
      `Expected white accent (#FFFFFF), got #${accent}`,
    );
  });

  it('resolves different themes by mode', () => {
    const light = guardrThemeForMode('light').colors.accent;
    const dark  = guardrThemeForMode('dark').colors.accent;
    assert.notEqual(light, dark, 'Light and dark themes must have different accent colors');
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
