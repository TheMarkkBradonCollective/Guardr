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
  it('lets personal accounts request, rebook, and schedule recurring coverage', () => {
    const caps = clientCapabilities('personal');
    for (const cap of SHARED_CLIENT_CAPABILITIES) {
      assert.equal(caps.has(cap), true, cap);
    }
    for (const cap of BUSINESS_ONLY_CAPABILITIES) {
      assert.equal(caps.has(cap), false, cap);
    }
    assert.equal(clientHasCapability('personal', 'recurring-schedules'), true);
    assert.equal(clientHasCapability('personal', 'rebook-service'), true);
    assert.equal(clientHasCapability('personal', 'rehire-guard'), true);
  });

  it('gives business and security company accounts every shared tool plus site/staffing extras', () => {
    for (const kind of ['business', 'security-company'] as const) {
      const caps = clientCapabilities(kind);
      for (const cap of [...SHARED_CLIENT_CAPABILITIES, ...BUSINESS_ONLY_CAPABILITIES]) {
        assert.equal(caps.has(cap), true, `${kind}:${cap}`);
      }
    }
    assert.equal(clientHasCapability({ clientType: undefined }, 'reporting'), true);
    assert.equal(clientHasCapability({ clientType: 'personal' }, 'reporting'), false);
  });

  it('keeps bulk site staffing as a business tool, not a one-request limit', () => {
    assert.equal(clientMaxGuardsPerRequest('personal'), 4);
    assert.equal(clientMaxGuardsPerRequest('business'), 50);
    assert.equal(clientMaxGuardsPerRequest('security-company'), 50);
    assert.equal(clampClientGuardsNeeded(12, 'personal'), 4);
    assert.equal(clampClientGuardsNeeded(12, 'business'), 12);
    assert.equal(clampClientGuardsNeeded(8, 'personal', 6), 6);
    assert.equal(clientMaxSavedLocations('personal'), null);
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
    assert.deepEqual(personalHome, ['request', 'guards', 'locations', 'schedule', 'recurring']);
    assert.equal(
      clientHomeQuickActions('personal').find((item) => item.id === 'request')?.sub,
      'Request another anytime'
    );
    assert.equal(
      clientHomeQuickActions('personal').find((item) => item.id === 'recurring')?.label,
      'Recurring security'
    );
    assert.ok(businessHome.includes('recurring'));
    assert.ok(businessHome.includes('reports'));
    assert.equal(clientPostJobLabel('personal'), '+ Request security');
    assert.equal(clientPostJobLabel('business'), '+ Post a job');
    assert.equal(clientPostJobLabel('security-company'), '+ Post overflow job');
  });
});
