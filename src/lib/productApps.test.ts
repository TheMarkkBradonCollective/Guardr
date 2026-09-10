import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildWebsiteAccountPath,
  canUseOperationalAppInBrowser,
  defaultPathForSignedInUser,
  defaultOperationalPathForRole,
  isOperationalAppPath,
  isWebsiteAccountPath,
  nativeDeepLinkForRole,
  openAppCtaCopy,
  parseBakedNativeProductApp,
  parseWebsiteAccountView,
  pathFromDeepLink,
  installPathForApp,
  NATIVE_APPLICATION_IDS,
  PRODUCT_APP_ICON_LABELS,
  productAppHasLightLauncher,
  productAppHasGreyLauncher,
  installedAuthEntry,
  productAppForRole,
  productAppFromPath,
  productRoleForApp,
  resolveProductApp,
  roleCanOpenProductApp,
  websiteAccountViewsForRole,
  websiteNeedsAppMessage,
  websiteShellAccess,
  wrongAppMessage,
} from './productApps.ts';

describe('product app path resolution', () => {
  it('treats marketing and account URLs as the website', () => {
    assert.equal(productAppFromPath('/'), 'website');
    assert.equal(productAppFromPath('/account'), 'website');
    assert.equal(productAppFromPath('/account/billing'), 'website');
    assert.equal(productAppFromPath('/legal/terms'), 'website');
    assert.equal(isWebsiteAccountPath('/account/settings'), true);
    assert.equal(isOperationalAppPath('/account'), false);
  });

  it('maps each operational prefix to its dedicated app', () => {
    assert.equal(productAppFromPath('/client/home'), 'client');
    assert.equal(productAppFromPath('/guard/map'), 'guard');
    assert.equal(productAppFromPath('/staff/overview'), 'staff');
    assert.equal(productAppFromPath('/dispatch'), 'staff');
    assert.equal(isOperationalAppPath('/guard/my-jobs'), true);
    assert.equal(isWebsiteAccountPath('/client/home'), false);
  });

  it('parses website account views including billing aliases', () => {
    assert.equal(parseWebsiteAccountView('/account'), 'home');
    assert.equal(parseWebsiteAccountView('/account/profile'), 'profile');
    assert.equal(parseWebsiteAccountView('/account/payments'), 'billing');
    assert.equal(parseWebsiteAccountView('/account/receipts'), 'billing');
    assert.equal(parseWebsiteAccountView('/account/downloads'), 'downloads');
    assert.equal(buildWebsiteAccountPath('home'), '/account');
    assert.equal(buildWebsiteAccountPath('settings'), '/account/settings');
    assert.equal(buildWebsiteAccountPath('downloads'), '/account/downloads');
  });
});

describe('signed-in landing', () => {
  it('sends browser sessions to activation until Customer/Guard accounts are active', () => {
    assert.equal(defaultPathForSignedInUser('client', false), '/client/home');
    assert.equal(defaultPathForSignedInUser('guard', false), '/guard/activation');
    assert.equal(defaultPathForSignedInUser('staff', false), '/staff/overview');
    assert.equal(defaultPathForSignedInUser('client', false, { clientStatus: 'pending' }), '/client/home');
    assert.equal(defaultPathForSignedInUser('client', false, { clientStatus: 'active' }), '/account');
    assert.equal(defaultPathForSignedInUser('guard', false, { guardStatus: 'pending' }), '/guard/activation');
    assert.equal(defaultPathForSignedInUser('guard', false, { guardStatus: 'active' }), '/account');
    assert.equal(defaultPathForSignedInUser('guard', false, { guardStatus: 'approved' }), '/guard/activation');
  });

  it('sends installed shells straight into the role app', () => {
    assert.equal(defaultPathForSignedInUser('client', true), '/client/home');
    assert.equal(defaultPathForSignedInUser('guard', true), '/guard/map');
    assert.equal(defaultPathForSignedInUser('staff', true), '/staff/overview');
  });

  it('lets staff use operations in the browser and keeps active Customer/Guard on the account website', () => {
    assert.equal(canUseOperationalAppInBrowser('staff'), true);
    assert.equal(canUseOperationalAppInBrowser('client'), false);
    assert.equal(canUseOperationalAppInBrowser('guard'), false);
    assert.equal(websiteShellAccess({ role: 'staff' }), 'operations');
    assert.equal(websiteShellAccess({ role: 'client' }), 'activation');
    assert.equal(websiteShellAccess({ role: 'guard', guardStatus: 'approved' }), 'activation');
    assert.equal(websiteShellAccess({ role: 'client', clientStatus: 'active' }), 'account');
    assert.equal(websiteShellAccess({ role: 'guard', guardStatus: 'active' }), 'account');
    assert.equal(websiteShellAccess({ role: 'guard', isInstalledShell: true, guardStatus: 'active' }), 'operations');
    assert.equal(websiteNeedsAppMessage('client'), 'You need the Customer app to use the platform.');
    assert.equal(websiteNeedsAppMessage('guard'), 'You need the Guard app to use the platform.');
    assert.equal(websiteNeedsAppMessage('staff'), '');
  });

  it('keeps operational defaults distinct per role', () => {
    assert.equal(defaultOperationalPathForRole('client'), '/client/home');
    assert.equal(defaultOperationalPathForRole('guard'), '/guard/map');
    assert.equal(defaultOperationalPathForRole('staff'), '/staff/overview');
  });
});

describe('role isolation', () => {
  it('maps platform roles onto the three apps', () => {
    assert.equal(productAppForRole('client'), 'client');
    assert.equal(productAppForRole('guard'), 'guard');
    assert.equal(productAppForRole('staff'), 'staff');
    assert.equal(productRoleForApp('website'), null);
    assert.equal(productRoleForApp('guard'), 'guard');
    assert.equal(PRODUCT_APP_ICON_LABELS.client, 'Customer');
    assert.equal(PRODUCT_APP_ICON_LABELS.guard, 'Guard');
    assert.equal(PRODUCT_APP_ICON_LABELS.staff, 'Staff');
    assert.equal(productAppHasLightLauncher('guard'), true);
    assert.equal(productAppHasLightLauncher('staff'), false);
    assert.equal(productAppHasGreyLauncher('staff'), true);
    assert.equal(productAppHasLightLauncher('client'), false);
  });

  it('skips the log-in-as picker inside a role APK', () => {
    assert.deepEqual(installedAuthEntry('guard', 'sign-in'), { type: 'form', role: 'guard' });
    assert.deepEqual(installedAuthEntry('guard', 'sign-up'), { type: 'form', role: 'guard' });
    assert.deepEqual(installedAuthEntry('staff', 'sign-in'), { type: 'form', role: 'staff' });
    assert.deepEqual(installedAuthEntry('client', 'sign-in'), { type: 'client-kind' });
    assert.deepEqual(installedAuthEntry('client', 'sign-up'), { type: 'client-kind' });
    assert.deepEqual(installedAuthEntry('website', 'sign-in'), { type: 'role-picker' });
  });

  it('blocks cross-app access at the product boundary', () => {
    assert.equal(roleCanOpenProductApp('client', 'guard'), false);
    assert.equal(roleCanOpenProductApp('guard', 'staff'), false);
    assert.equal(roleCanOpenProductApp('staff', 'client'), false);
    assert.equal(roleCanOpenProductApp('client', 'client'), true);
    assert.equal(roleCanOpenProductApp('client', 'website'), true);
    assert.match(wrongAppMessage('staff', 'client'), /Staff/);
  });

  it('offers account sections without operational destinations', () => {
    const clientViews = websiteAccountViewsForRole('client').map((item) => item.id);
    const guardViews = websiteAccountViewsForRole('guard').map((item) => item.id);
    assert.ok(clientViews.includes('billing'));
    assert.ok(!clientViews.includes('payouts'));
    assert.ok(guardViews.includes('payouts'));
    assert.ok(!guardViews.includes('billing'));
    assert.ok(clientViews.includes('home'));
    assert.ok(clientViews.includes('downloads'));
    assert.ok(guardViews.includes('downloads'));
  });
});

describe('deep links and CTAs', () => {
  it('converts custom schemes into in-app paths', () => {
    assert.equal(pathFromDeepLink('guardr-client://home'), '/client/home');
    assert.equal(pathFromDeepLink('guardr-guard://my-jobs'), '/guard/my-jobs');
    assert.equal(pathFromDeepLink('guardr-staff://jobs'), '/staff/jobs');
    assert.equal(pathFromDeepLink('https://www.guardr.co/client/requests'), '/client/requests');
  });

  it('builds native deep links per role', () => {
    assert.equal(nativeDeepLinkForRole('guard'), 'guardr-guard://map');
    assert.equal(nativeDeepLinkForRole('client', '/client/messages'), 'guardr-client://messages');
  });

  it('assigns distinct Android application ids per app', () => {
    assert.equal(NATIVE_APPLICATION_IDS.client, 'com.signaturesecurity.guardr.client');
    assert.equal(NATIVE_APPLICATION_IDS.guard, 'com.signaturesecurity.guardr.guard');
    assert.equal(NATIVE_APPLICATION_IDS.staff, 'com.signaturesecurity.guardr.staff');
    assert.equal(parseBakedNativeProductApp('staff'), 'staff');
    assert.equal(parseBakedNativeProductApp(''), null);
  });

  it('sends install links to the private account Downloads tab', () => {
    assert.equal(installPathForApp('client'), '/account/downloads');
    assert.equal(installPathForApp('guard'), '/account/downloads');
    assert.equal(installPathForApp('staff'), '/account/downloads');
  });

  it('uses role-specific open-app copy', () => {
    assert.equal(openAppCtaCopy('client').action, 'Open Customer');
    assert.equal(openAppCtaCopy('guard').action, 'Open Guard');
    assert.equal(openAppCtaCopy('staff').action, 'Open operations');
    assert.match(openAppCtaCopy('staff').body, /browser/i);
  });
});

describe('resolveProductApp', () => {
  it('prefers the URL over stored app identity', () => {
    assert.equal(resolveProductApp({ url: '/guard/map', stored: 'client' }), 'guard');
    assert.equal(resolveProductApp({ url: '/account', stored: 'guard', isInstalledShell: false }), 'website');
  });

  it('uses stored identity only for installed shells on website paths', () => {
    assert.equal(
      resolveProductApp({ url: '/', stored: 'guard', isInstalledShell: true }),
      'guard',
    );
    assert.equal(
      resolveProductApp({ url: '/', stored: 'guard', isInstalledShell: false }),
      'website',
    );
  });

  it('prefers a baked APK identity over stored website on launch', () => {
    assert.equal(
      resolveProductApp({ url: '/', stored: null, isInstalledShell: true, baked: 'client' }),
      'client',
    );
    assert.equal(
      resolveProductApp({ url: '/', stored: 'staff', isInstalledShell: true, baked: 'guard' }),
      'guard',
    );
  });
});

