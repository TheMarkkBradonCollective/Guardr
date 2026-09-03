import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Client } from '../types';
import {
  activeRosterEntries,
  addGuardToCompanyRoster,
  isGuardOnCompanyRoster,
  removeGuardFromCompanyRoster,
} from './securityCompanyRoster';
import { guardCompanyRosterMemberships } from './guardCompanyRoster';
import { isClientViewAllowedForType } from './clientProductModules';

function securityClient(partial: Partial<Client> = {}): Client {
  return {
    id: 'sc-1',
    name: 'Acme Security',
    email: 'ops@acme.test',
    companyName: 'Acme Security',
    clientType: 'security-company',
    phone: '',
    avatar: '',
    totalRequests: 0,
    securityCompanyRoster: [],
    ...partial,
  };
}

describe('securityCompanyRoster', () => {
  it('adds and removes roster guards', () => {
    const client = securityClient();
    const added = addGuardToCompanyRoster(client, 'guard-1');
    assert.ok(!('error' in added));
    if ('error' in added) return;
    assert.equal(activeRosterEntries(added.client).length, 1);
    assert.equal(isGuardOnCompanyRoster(added.client, 'guard-1'), true);
    const removed = removeGuardFromCompanyRoster(added.client, 'guard-1');
    assert.equal(activeRosterEntries(removed).length, 0);
  });
});

describe('guardCompanyRoster', () => {
  it('lists memberships for guards on company rosters', () => {
    const added = addGuardToCompanyRoster(securityClient(), 'guard-9');
    assert.ok(!('error' in added));
    if ('error' in added) return;
    const memberships = guardCompanyRosterMemberships('guard-9', [added.client]);
    assert.equal(memberships.length, 1);
    assert.equal(memberships[0]?.companyName, 'Acme Security');
  });
});

describe('security company views', () => {
  it('allows roster and operations only for security company capabilities', () => {
    assert.equal(isClientViewAllowedForType('roster', 'security-company'), true);
    assert.equal(isClientViewAllowedForType('operations', 'security-company'), true);
    assert.equal(isClientViewAllowedForType('roster', 'business'), false);
    assert.equal(isClientViewAllowedForType('map', 'security-company'), false);
    assert.equal(isClientViewAllowedForType('map', 'business'), true);
  });
});
