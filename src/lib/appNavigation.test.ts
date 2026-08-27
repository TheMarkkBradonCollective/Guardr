import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard } from '../types';
import {
  normalizeGuardTabForAccount,
  parseAppRoute,
  readAuthChoiceFromUrl,
  readAuthSignupPickFromUrl,
  readLegalPageFromUrl,
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

  it('reads the three sign-up selection pages', () => {
    assert.equal(readAuthChoiceFromUrl('/?auth=sign-up&pick=path'), 'sign-up');
    assert.equal(readAuthChoiceFromUrl('/?auth=sign-up&pick=client'), 'sign-up');
    assert.equal(readAuthChoiceFromUrl('/?auth=sign-up&pick=work'), 'sign-up');
    assert.equal(readAuthSignupPickFromUrl('/?auth=sign-up&pick=path'), 'path');
    assert.equal(readAuthSignupPickFromUrl('/?auth=sign-up&pick=client'), 'client');
    assert.equal(readAuthSignupPickFromUrl('/?auth=sign-up&pick=work'), 'work');
    assert.equal(readAuthSignupPickFromUrl('/?auth=sign-up&pick=role'), 'path');
    assert.equal(parseAppRoute('/?auth=sign-up&pick=path'), null);
    assert.equal(parseAppRoute('/?auth=sign-up&pick=client'), null);
    assert.equal(parseAppRoute('/?auth=sign-up&pick=work'), null);
  });

  it('parses personal vs business client sign-up', () => {
    assert.deepEqual(parseAppRoute('/?auth=sign-up&ar=client&ct=personal'), {
      role: 'client',
      authView: 'sign-up',
      authRole: 'client',
      authClientType: 'personal',
    });
    assert.deepEqual(parseAppRoute('/?auth=sign-up&ar=client&ct=business'), {
      role: 'client',
      authView: 'sign-up',
      authRole: 'client',
      authClientType: 'business',
    });
    assert.deepEqual(parseAppRoute('/?auth=sign-up&ar=client&ck=personal'), {
      role: 'client',
      authView: 'sign-up',
      authRole: 'client',
      authClientType: 'personal',
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
        id: 'c-pta',
        catalogId: 'bsis-power-to-arrest',
        name: 'Power to Arrest',
        issuer: 'BSIS',
        number: 'PTA-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'pta',
        category: 'bsis-training',
      },
      {
        id: 'c-uof',
        catalogId: 'bsis-appropriate-use-of-force',
        name: 'Appropriate Use of Force',
        issuer: 'BSIS',
        number: 'UOF-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'uof',
        category: 'bsis-training',
      },
      {
        id: 'c-pr',
        catalogId: 'bsis-public-relations',
        name: 'Public Relations',
        issuer: 'BSIS',
        number: 'PR-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'pr',
        category: 'bsis-training',
      },
      {
        id: 'c-obs',
        catalogId: 'bsis-observation-documentation',
        name: 'Observation and Documentation',
        issuer: 'BSIS',
        number: 'OBS-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'obs',
        category: 'bsis-training',
      },
      {
        id: 'c-comm',
        catalogId: 'bsis-communication',
        name: 'Communication',
        issuer: 'BSIS',
        number: 'COMM-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'comm',
        category: 'bsis-training',
      },
      {
        id: 'c-legal',
        catalogId: 'bsis-liability-legal',
        name: 'Liability / Legal Aspects',
        issuer: 'BSIS',
        number: 'LEG-1',
        issueDate: '2024-01-01',
        status: 'verified',
        imageUrl: 'legal',
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

describe('unified payments routes', () => {
  it('parses payments routes for guard and client', () => {
    assert.deepEqual(parseAppRoute('/guard/payments'), {
      role: 'guard',
      guardTab: 'earnings',
    });
    assert.deepEqual(parseAppRoute('/client/payments'), {
      role: 'client',
      clientView: 'invoices',
    });
  });

  it('parses staff guard timesheet tab', () => {
    assert.deepEqual(parseAppRoute('/staff/guards?g=g1&gtab=timesheet'), {
      role: 'staff',
      staffSection: 'guards',
      staffGuardId: 'g1',
      staffGuardTab: 'timesheet',
      staffMessageTab: undefined,
    });
  });
});

describe('legal page URLs', () => {
  it('maps equal opportunity to a public legal page', () => {
    assert.equal(readLegalPageFromUrl('/legal/equal-opportunity'), 'equal-opportunity');
    assert.equal(parseAppRoute('/legal/equal-opportunity'), null);
  });
});
