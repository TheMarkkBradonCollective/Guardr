import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  experienceAllowsDecorativeArt,
  experienceAllowsGlassChrome,
  experienceAllowsHaptics,
  experienceMotionScale,
  experienceTierDataset,
  isLiteExperience,
  isPremiumExperience,
  resolveApkExperience,
  resolveExperienceTier,
  resolvePwaExperience,
  shouldPreferPwaLite,
} from './experienceTier.ts';

describe('resolveExperienceTier', () => {
  it('returns website standard for browser shell', () => {
    const tier = resolveExperienceTier('browser', 'desktop');
    assert.deepEqual(tier, { shell: 'browser', mode: 'standard' });
    assert.equal(isLiteExperience(tier), false);
    assert.equal(isPremiumExperience(tier), false);
  });

  it('resolves pwa and native tiers', () => {
    const pwa = resolveExperienceTier('pwa', 'mobile');
    assert.equal(pwa.shell, 'pwa');
    assert.ok(pwa.mode === 'full' || pwa.mode === 'lite');

    const native = resolveExperienceTier('native', 'mobile');
    assert.equal(native.shell, 'native');
    assert.ok(native.mode === 'full' || native.mode === 'premium');
  });
});

describe('resolveApkExperience', () => {
  it('defaults phones to full and tablets to premium without overrides', () => {
    assert.equal(resolveApkExperience('mobile'), 'full');
    assert.equal(resolveApkExperience('tablet'), 'premium');
    assert.equal(resolveApkExperience('desktop'), 'premium');
  });
});

describe('resolvePwaExperience', () => {
  it('returns a valid pwa mode in node (no lite signals)', () => {
    assert.equal(shouldPreferPwaLite(), false);
    assert.equal(resolvePwaExperience(), 'full');
  });
});

describe('experienceTierDataset', () => {
  it('emits CSS-friendly dataset values', () => {
    assert.deepEqual(experienceTierDataset({ shell: 'browser', mode: 'standard' }), {
      experienceTier: 'website',
    });
    assert.deepEqual(experienceTierDataset({ shell: 'pwa', mode: 'lite' }), {
      experienceTier: 'pwa-lite',
      pwaMode: 'lite',
    });
    assert.deepEqual(experienceTierDataset({ shell: 'native', mode: 'premium' }), {
      experienceTier: 'apk-premium',
      apkMode: 'premium',
    });
  });
});

describe('experience capability helpers', () => {
  it('gates decorative art, glass, haptics, and motion scale', () => {
    const lite = { shell: 'pwa' as const, mode: 'lite' as const };
    const fullPwa = { shell: 'pwa' as const, mode: 'full' as const };
    const premium = { shell: 'native' as const, mode: 'premium' as const };
    const fullApk = { shell: 'native' as const, mode: 'full' as const };

    assert.equal(experienceAllowsDecorativeArt(lite), false);
    assert.equal(experienceAllowsDecorativeArt(fullPwa), true);
    assert.equal(experienceAllowsGlassChrome(lite), false);
    assert.equal(experienceAllowsGlassChrome(fullPwa), true);
    assert.equal(experienceAllowsHaptics(premium), true);
    assert.equal(experienceAllowsHaptics(fullApk), false);
    assert.equal(experienceMotionScale(lite), 0.55);
    assert.ok(experienceMotionScale(premium) > 1);
  });
});
