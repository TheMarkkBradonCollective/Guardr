import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { guardrStripeAppearance } from './stripeAppearance.ts';

describe('guardrStripeAppearance', () => {
  it('uses night theme tokens in dark mode', () => {
    const dark = guardrStripeAppearance('dark');
    assert.equal(dark.theme, 'night');
    assert.ok(dark.variables?.colorPrimary);
  });

  it('uses stripe theme in light mode', () => {
    const light = guardrStripeAppearance('light');
    assert.equal(light.theme, 'stripe');
  });
});
