import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isAdvancedDesktopSurface,
  isInstalledAppSurface,
  isTabletMergeSurface,
  prefersMobileGestureUi,
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

  it('keeps gesture UI off website desktop only', () => {
    assert.equal(prefersMobileGestureUi('browser-desktop'), false);
    assert.equal(prefersMobileGestureUi('browser-mobile'), true);
    assert.equal(prefersMobileGestureUi('browser-tablet'), true);
    assert.equal(prefersMobileGestureUi('pwa-desktop'), true);
    assert.equal(prefersMobileGestureUi('pwa-mobile'), true);
    assert.equal(prefersMobileGestureUi('native-desktop'), true);
    assert.equal(prefersMobileGestureUi('native-mobile'), true);
  });
});
