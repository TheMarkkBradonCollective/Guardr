import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildWebsiteAccountPath,
  defaultPathForSignedInUser,
  defaultOperationalPathForRole,
  isOperationalAppPath,
  isWebsiteAccountPath,
  nativeDeepLinkForRole,
  openAppCtaCopy,
  parseBakedNativeProductApp,
  parseWebsiteAccountView,
  pathFromDeepLink,
  NATIVE_APPLICATION_IDS,
  PRODUCT_APP_ICON_LABELS,
  productAppForRole,
  productAppFromPath,
  resolveProductApp,
  roleCanOpenProductApp,
  websiteAccountViewsForRole,
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
    assert.equal(buildWebsiteAccountPath('home'), '/account');
    assert.equal(buildWebsiteAccountPath('settings'), '/account/settings');
  });
});

describe('signed-in landing', () => {
  it('sends browser sessions to the website account portal', () => {
    assert.equal(defaultPathForSignedInUser('client', false), '/account');
    assert.equal(defaultPathForSignedInUser('guard', false), '/account');
    assert.equal(defaultPathForSignedInUser('staff', false), '/account');
  });

  it('sends installed shells straight into the role app', () => {
    assert.equal(defaultPathForSignedInUser('client', true), '/client/home');
    assert.equal(defaultPathForSignedInUser('guard', true), '/guard/map');
    assert.equal(defaultPathForSignedInUser('staff', true), '/staff/overview');
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
    assert.equal(PRODUCT_APP_ICON_LABELS.client, 'Hire');
    assert.equal(PRODUCT_APP_ICON_LABELS.guard, 'Work');
    assert.equal(PRODUCT_APP_ICON_LABELS.staff, 'Staff');
  });

  it('blocks cross-app access at the product boundary', () => {
    assert.equal(roleCanOpenProductApp('client', 'guard'), false);
    assert.equal(roleCanOpenProductApp('guard', 'staff'), false);
    assert.equal(roleCanOpenProductApp('staff', 'client'), false);
    assert.equal(roleCanOpenProductApp('client', 'client'), true);
    assert.equal(roleCanOpenProductApp('client', 'website'), true);
    assert.match(wrongAppMessage('staff', 'client'), /Staff App/);
  });

  it('offers account sections without operational destinations', () => {
    const clientViews = websiteAccountViewsForRole('client').map((item) => item.id);
    const guardViews = websiteAccountViewsForRole('guard').map((item) => item.id);
    assert.ok(clientViews.includes('billing'));
    assert.ok(!clientViews.includes('payouts'));
    assert.ok(guardViews.includes('payouts'));
    assert.ok(!guardViews.includes('billing'));
    assert.ok(clientViews.includes('home'));
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

  it('uses role-specific open-app copy', () => {
    assert.equal(openAppCtaCopy('client').action, 'Open Client App');
    assert.equal(openAppCtaCopy('guard').action, 'Open Guard App');
    assert.equal(openAppCtaCopy('staff').action, 'Open Staff App');
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

