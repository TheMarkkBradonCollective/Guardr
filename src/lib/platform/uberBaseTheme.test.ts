import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { uberDarkTheme, uberLightTheme, uberThemeForMode } from '../../theme/uberBaseTheme.ts';
import { motionDuration, prefersReducedMotion, MOTION_DURATION } from '../../theme/motionTokens.ts';

describe('uberBaseTheme', () => {
  it('uses Guardr sage-green accent in light theme', () => {
    // Guardr branding: sage green (#4A6B4E) replaces stock Uber blue
    const accent = uberLightTheme.colors.accent.toUpperCase();
    assert.ok(
      accent === '#4A6B4E' || accent.startsWith('#4A6B4E'),
      `Expected sage-green accent, got ${accent}`,
    );
  });

  it('uses Guardr sage-green accent in dark theme', () => {
    // Brighter sage green for dark backgrounds (#7AAE7F)
    const accent = uberDarkTheme.colors.accent.toUpperCase();
    assert.ok(
      accent === '#7AAE7F' || accent.startsWith('#7AAE7F'),
      `Expected dark-mode sage-green accent, got ${accent}`,
    );
  });

  it('resolves correct theme by mode', () => {
    const lightAccent = uberThemeForMode('light').colors.accent.toUpperCase();
    const darkAccent  = uberThemeForMode('dark').colors.accent.toUpperCase();
    // Light and dark should differ
    assert.notEqual(lightAccent, darkAccent, 'Light and dark theme accents must differ');
    // Both should be sage-family greens
    assert.ok(lightAccent.includes('4A6B4E') || lightAccent.includes('5E7B'), `Unexpected light accent: ${lightAccent}`);
    assert.ok(darkAccent.includes('7AAE7F') || darkAccent.includes('6B8F'), `Unexpected dark accent: ${darkAccent}`);
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
