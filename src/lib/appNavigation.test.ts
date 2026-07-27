import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard } from '../types';
import {
  normalizeGuardTabForAccount,
  parseAppRoute,
  readAuthChoiceFromUrl,
  routeHasNestedSelection,
  routeWithoutNestedSelection,
  type AppRoute,
} from './appNavigation';

describe('auth role choice URLs', () => {
  it('reads role picker URLs separately from sign-in form URLs', () => {
    assert.equal(readAuthChoiceFromUrl('/?auth=sign-in&pick=role'), 'sign-in');
    assert.equal(readAuthChoiceFromUrl('/?auth=sign-up&pick=role'), 'sign-up');
    assert.equal(readAuthChoiceFromUrl('/?auth=sign-in&ar=guard'), null);
    assert.equal(parseAppRoute('/?auth=sign-in&pick=role'), null);
    assert.deepEqual(parseAppRoute('/?auth=sign-in&ar=guard'), {
      role: 'client',
      authView: 'sign-in',
      authRole: 'guard',
    });
  });
});

describe('client and guard nested job routes', () => {
  it('parses client jobs tab and selected job', () => {
    assert.deepEqual(parseAppRoute('/client/requests?jt=scheduled&cj=req-1'), {
      role: 'client',
      clientView: 'requests',
      clientJobsTab: 'scheduled',
      clientJobId: 'req-1',
    });
  });

  it('parses guard browse tab and selected job', () => {
    assert.deepEqual(parseAppRoute('/guard/my-jobs?bt=completed&gj=job-9'), {
      role: 'guard',
      guardTab: 'myJobs',
      guardJobsTab: 'completed',
      guardJobId: 'job-9',
    });
  });

  it('clears client and guard job selections via routeWithoutNestedSelection', () => {
    const route: AppRoute = {
      role: 'client',
      clientView: 'requests',
      clientJobId: 'req-1',
      clientJobsTab: 'open',
    };
    assert.equal(routeHasNestedSelection(route), true);
    assert.equal(routeWithoutNestedSelection(route).clientJobId, undefined);
    assert.equal(routeWithoutNestedSelection(route).clientJobsTab, 'open');

    const guardRoute: AppRoute = {
      role: 'guard',
      guardTab: 'myJobs',
      guardJobId: 'job-9',
      guardJobsTab: 'available',
    };
    assert.equal(routeHasNestedSelection(guardRoute), true);
    assert.equal(routeWithoutNestedSelection(guardRoute).guardJobId, undefined);
  });
});

describe('routeHasNestedSelection', () => {
  it('detects nested route params', () => {
    const route: AppRoute = { role: 'staff', staffSection: 'guards', staffGuardId: 'g1' };
    assert.equal(routeHasNestedSelection(route), true);
    assert.equal(routeHasNestedSelection(routeWithoutNestedSelection(route)), false);
  });
});

function fullyActiveGuard(): SecurityGuard {
  return {
    id: 'g1',
    name: 'Test Guard',
    email: 'guard@test.com',
    userStatus: 'active',
    verified: true,
    isStaff: false,
    idVerificationStatus: 'verified',
    idState: 'CA',
    idNumber: 'ID123',
    idExpiryDate: '2099-12-31',
    idFrontUrl: 'front',
    idBackUrl: 'back',
    idSelfieUrl: 'selfie',
    insurancePolicy: {
      id: 'ins-1',
      guardId: 'g1',
      carrier: 'Carrier',
      policyNumber: 'POL-1',
      expiryDate: '2099-12-31',
      documentUrl: 'doc',
      status: 'verified',
    },
    certifications: [
      {
        id: 'c1',
        catalogId: 'bsis-guard-card',
        name: 'BSIS Guard Card',
        issuer: 'BSIS',
        number: 'GC-1',
        state: 'CA',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'card',
        category: 'guard-card',
      },
      {
        id: 'c2',
        catalogId: 'bsis-pta-uof-8hr',
        name: 'PTA/UOF',
        issuer: 'BSIS',
        number: 'PTA-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'pta',
        category: 'bsis-training',
      },
      {
        id: 'c3',
        catalogId: 'bsis-32-hour-completed',
        name: '32-hour block',
        issuer: 'BSIS',
        number: '32-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: '32hr',
        category: 'bsis-training',
      },
    ],
  } as SecurityGuard;
}

describe('normalizeGuardTabForAccount', () => {
  it('allows fully active guards to use any tab', () => {
    const guard = fullyActiveGuard();
    assert.equal(normalizeGuardTabForAccount('map', guard), 'map');
    assert.equal(normalizeGuardTabForAccount('earnings', guard), 'earnings');
    assert.equal(normalizeGuardTabForAccount('settings', guard), 'settings');
    assert.equal(normalizeGuardTabForAccount('activation', guard), 'map');
  });

  it('allows staff guards to use any tab', () => {
    const guard = { userStatus: 'pending' as const, isStaff: true };
    assert.equal(normalizeGuardTabForAccount('map', guard), 'map');
  });

  it('routes inactive guards to activation except settings', () => {
    const guard = { userStatus: 'pending' as const, isStaff: false };
    assert.equal(normalizeGuardTabForAccount('map', guard), 'activation');
    assert.equal(normalizeGuardTabForAccount('myJobs', guard), 'activation');
    assert.equal(normalizeGuardTabForAccount('messages', guard), 'activation');
    assert.equal(normalizeGuardTabForAccount('settings', guard), 'settings');
  });

  it('routes approved-but-not-active guards to activation except settings and support', () => {
    const guard = { userStatus: 'approved' as const, isStaff: false };
    assert.equal(normalizeGuardTabForAccount('map', guard), 'activation');
    assert.equal(normalizeGuardTabForAccount('settings', guard), 'settings');
    assert.equal(normalizeGuardTabForAccount('support', guard), 'support');
  });

  it('allows user_status active guards to use the app even when credentials are still loading', () => {
    const guard = { userStatus: 'active' as const, isStaff: false };
    assert.equal(normalizeGuardTabForAccount('map', guard), 'map');
    assert.equal(normalizeGuardTabForAccount('myJobs', guard), 'myJobs');
    assert.equal(normalizeGuardTabForAccount('settings', guard), 'settings');
  });

  it('normalizes legacy chat tabs before gating', () => {
    const guard = fullyActiveGuard();
    assert.equal(normalizeGuardTabForAccount('guardChat', guard), 'messages');
    assert.equal(normalizeGuardTabForAccount('support', guard), 'support');
  });

  it('defaults unknown guard profiles to activation until profile loads', () => {
    assert.equal(normalizeGuardTabForAccount('map', undefined), 'activation');
    assert.equal(normalizeGuardTabForAccount(undefined, undefined), 'activation');
    assert.equal(normalizeGuardTabForAccount('settings', undefined), 'settings');
  });
});
