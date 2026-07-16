import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isAdvancedDesktopSurface,
  isInstalledAppSurface,
  isTabletMergeSurface,
  resolveViewSurface,
} from './viewSurface.ts';

describe('viewSurface', () => {
  it('resolves shell and form factor into a surface id', () => {
    assert.equal(resolveViewSurface('browser', 'desktop'), 'browser-desktop');
    assert.equal(resolveViewSurface('browser', 'tablet'), 'browser-tablet');
    assert.equal(resolveViewSurface('pwa', 'mobile'), 'pwa-mobile');
    assert.equal(resolveViewSurface('native', 'tablet'), 'native-tablet');
  });

  it('detects installed app surfaces', () => {
    assert.equal(isInstalledAppSurface('browser-mobile'), false);
    assert.equal(isInstalledAppSurface('pwa-tablet'), true);
    assert.equal(isInstalledAppSurface('native-mobile'), true);
  });

  it('detects tablet merge surfaces', () => {
    assert.equal(isTabletMergeSurface('browser-tablet'), true);
    assert.equal(isTabletMergeSurface('native-tablet'), true);
    assert.equal(isTabletMergeSurface('browser-mobile'), false);
  });

  it('limits advanced desktop to browser desktop', () => {
    assert.equal(isAdvancedDesktopSurface('browser-desktop'), true);
    assert.equal(isAdvancedDesktopSurface('pwa-desktop'), false);
    assert.equal(isAdvancedDesktopSurface('browser-tablet'), false);
  });
});
