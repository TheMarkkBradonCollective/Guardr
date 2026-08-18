import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BUSINESS_ONLY_CAPABILITIES,
  SHARED_CLIENT_CAPABILITIES,
  clampClientGuardsNeeded,
  clientCapabilities,
  clientHasCapability,
  clientHomeQuickActions,
  clientMaxGuardsPerRequest,
  clientMaxSavedLocations,
  clientOverflowNav,
  clientPostJobLabel,
  isClientViewAllowed,
  resolveAllowedClientView,
} from './clientCapabilities';

describe('clientCapabilities', () => {
  it('gives personal accounts the shared tools only', () => {
    const caps = clientCapabilities('personal');
    for (const cap of SHARED_CLIENT_CAPABILITIES) {
      assert.equal(caps.has(cap), true, cap);
    }
    for (const cap of BUSINESS_ONLY_CAPABILITIES) {
      assert.equal(caps.has(cap), false, cap);
    }
  });

  it('gives business accounts every shared tool plus site/staffing extras', () => {
    const caps = clientCapabilities('business');
    for (const cap of [...SHARED_CLIENT_CAPABILITIES, ...BUSINESS_ONLY_CAPABILITIES]) {
      assert.equal(caps.has(cap), true, cap);
    }
    assert.equal(clientHasCapability({ clientType: undefined }, 'reporting'), true);
    assert.equal(clientHasCapability({ clientType: 'personal' }, 'reporting'), false);
  });

  it('keeps personal request size small and business site staffing larger', () => {
    assert.equal(clientMaxGuardsPerRequest('personal'), 4);
    assert.equal(clientMaxGuardsPerRequest('business'), 50);
    assert.equal(clampClientGuardsNeeded(12, 'personal'), 4);
    assert.equal(clampClientGuardsNeeded(12, 'business'), 12);
    assert.equal(clampClientGuardsNeeded(8, 'personal', 6), 6);
    assert.equal(clientMaxSavedLocations('personal'), 8);
    assert.equal(clientMaxSavedLocations('business'), null);
  });

  it('hides business-only views from personal accounts', () => {
    assert.equal(isClientViewAllowed('reports', 'personal'), false);
    assert.equal(isClientViewAllowed('reports', 'business'), true);
    assert.equal(isClientViewAllowed('locations', 'personal'), true);
    assert.equal(resolveAllowedClientView('reports', 'personal'), 'home');
    assert.equal(resolveAllowedClientView('invoices', 'personal'), 'invoices');
  });

  it('filters overflow nav and home actions by type', () => {
    const personalNav = clientOverflowNav('personal').map((item) => item.id);
    const businessNav = clientOverflowNav('business').map((item) => item.id);
    assert.deepEqual(personalNav, ['invoices', 'guards', 'locations', 'settings']);
    assert.deepEqual(businessNav, ['invoices', 'guards', 'locations', 'reports', 'settings']);
    assert.equal(clientOverflowNav('personal').find((i) => i.id === 'locations')?.label, 'Locations');
    assert.equal(clientOverflowNav('business').find((i) => i.id === 'locations')?.label, 'Sites');
    assert.equal(clientOverflowNav('business').find((i) => i.id === 'invoices')?.label, 'Billing');

    const personalHome = clientHomeQuickActions('personal').map((item) => item.id);
    const businessHome = clientHomeQuickActions('business').map((item) => item.id);
    assert.deepEqual(personalHome, ['request', 'guards', 'locations', 'schedule']);
    assert.ok(businessHome.includes('recurring'));
    assert.ok(businessHome.includes('reports'));
    assert.equal(clientPostJobLabel('personal'), '+ Request security');
    assert.equal(clientPostJobLabel('business'), '+ Post a job');
  });
});
