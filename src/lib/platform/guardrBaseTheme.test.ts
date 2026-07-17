import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { guardrDarkTheme, guardrLightTheme, guardrThemeForMode } from '../../theme/guardrBaseTheme.ts';
import { GUARDR_ACCENT_DARK, GUARDR_ACCENT_LIGHT } from '../../theme/guardrAccentPalette.ts';
import { motionDuration, prefersReducedMotion, MOTION_DURATION } from '../../theme/motionTokens.ts';

describe('guardrBaseTheme', () => {
  it('maps sage green accent in light theme', () => {
    assert.equal(guardrLightTheme.colors.accent, GUARDR_ACCENT_LIGHT.accent);
    assert.equal(guardrLightTheme.colors.buttonPrimaryFill, GUARDR_ACCENT_LIGHT.accent);
  });

  it('maps sage green accent in dark theme', () => {
    assert.equal(guardrDarkTheme.colors.accent, GUARDR_ACCENT_DARK.accent);
    assert.equal(guardrDarkTheme.colors.buttonPrimaryFill, GUARDR_ACCENT_DARK.accent);
  });

  it('resolves theme by mode', () => {
    assert.equal(guardrThemeForMode('light').colors.accent, GUARDR_ACCENT_LIGHT.accent);
    assert.equal(guardrThemeForMode('dark').colors.accent, GUARDR_ACCENT_DARK.accent);
  });

  it('uses Guardr border radius on cards', () => {
    assert.equal(guardrLightTheme.borders.radius400, '14px');
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
