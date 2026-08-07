import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveMobilityChrome } from '../../components/baseui/layout/mobilityChrome.ts';

describe('resolveMobilityChrome', () => {
  it('builds independent mobile / tablet / desktop layouts', () => {
    const mobile = resolveMobilityChrome('browser-mobile');
    assert.equal(mobile.layout, 'mobile');
    assert.equal(mobile.defaultSidebarOpen, false);
    assert.equal(mobile.sidebarWidth, '0px');

    const tablet = resolveMobilityChrome('browser-tablet');
    assert.equal(tablet.layout, 'tablet');
    assert.equal(tablet.defaultSidebarOpen, true);
    assert.ok(Number.parseInt(tablet.sidebarWidth, 10) >= 200);

    const desktop = resolveMobilityChrome('browser-desktop');
    assert.equal(desktop.layout, 'desktop');
    assert.equal(desktop.contentMaxWidth, '1600px');
  });

  it('disables glass chrome for PWA Lite and enables premium APK chrome', () => {
    const lite = resolveMobilityChrome('pwa-mobile', { shell: 'pwa', mode: 'lite' });
    assert.equal(lite.headerGlass, false);
    assert.equal(lite.liteChrome, true);
    assert.equal(lite.contentDensity, 'compact');

    const fullPwa = resolveMobilityChrome('pwa-mobile', { shell: 'pwa', mode: 'full' });
    assert.equal(fullPwa.headerGlass, true);
    assert.equal(fullPwa.liteChrome, false);

    const premium = resolveMobilityChrome('native-tablet', { shell: 'native', mode: 'premium' });
    assert.equal(premium.premiumChrome, true);
    assert.equal(premium.touchTargetPx, 48);
    assert.equal(premium.sidebarWidth, '260px');
  });

  it('puts the Uber Freight icon rail and page band on desktop workspaces only', () => {
    for (const surface of ['browser-desktop', 'pwa-desktop', 'native-desktop'] as const) {
      const chrome = resolveMobilityChrome(surface);
      assert.equal(chrome.showIconRail, true, `${surface} should show the rail`);
      assert.equal(chrome.showPageTitleBand, true, `${surface} should show the page band`);
      assert.ok(Number.parseInt(chrome.iconRailWidth, 10) >= 56);
    }

    for (const surface of ['browser-tablet', 'browser-mobile', 'pwa-mobile', 'native-mobile'] as const) {
      const chrome = resolveMobilityChrome(surface);
      assert.equal(chrome.showIconRail, false, `${surface} should not show the rail`);
      assert.equal(chrome.iconRailWidth, '0px');
      assert.equal(
        chrome.showPageTitleBand,
        false,
        `${surface} keeps the title in its compact header`,
      );
    }
  });

  it('widens the desktop rail for native shells so touch targets stay 48px', () => {
    assert.equal(resolveMobilityChrome('browser-desktop').iconRailWidth, '56px');
    assert.equal(
      resolveMobilityChrome('native-desktop', { shell: 'native', mode: 'premium' }).iconRailWidth,
      '64px',
    );
  });
});
