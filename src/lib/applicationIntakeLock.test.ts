import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Client, SecurityGuard } from '../types';
import {
  assertClientApplicationContactEditable,
  assertGuardApplicationIntakeEditable,
  isClientApplicationContactLocked,
  isGuardApplicationIntakeLocked,
} from './applicationIntakeLock.ts';

function guard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Alex Guard',
    email: 'alex@test.com',
    phone: '555-0100',
    yearsExperience: 3,
    specialties: ['Event'],
    serviceAreas: ['Los Angeles'],
    summary: 'Experienced guard',
    userStatus: 'pending',
    isStaff: false,
    certifications: [],
    ...overrides,
  } as SecurityGuard;
}

function client(overrides: Partial<Client> = {}): Client {
  return {
    id: 'c1',
    name: 'Casey Client',
    email: 'casey@test.com',
    companyName: 'Casey Co',
    phone: '555-0200',
    accountStatus: 'pending',
    approved: false,
    ...overrides,
  } as Client;
}

describe('applicationIntakeLock', () => {
  it('locks self-submitted guard applications after submit', () => {
    assert.equal(isGuardApplicationIntakeLocked(guard()), true);
  });

  it('unlocks when staff requested a revision', () => {
    assert.equal(
      isGuardApplicationIntakeLocked(
        guard({ applicationRevisionRequestedAt: '2026-07-21T00:00:00.000Z' })
      ),
      false
    );
  });

  it('allows first fill for staff-provisioned guards without intake', () => {
    assert.equal(
      isGuardApplicationIntakeLocked(
        guard({
          mustChangePassword: true,
          yearsExperience: undefined,
          specialties: undefined,
          serviceAreas: undefined,
          summary: undefined,
          availabilityNotes: undefined,
          guardCardStatus: undefined,
          armedPreference: undefined,
          hasReliableTransportation: undefined,
        })
      ),
      false
    );
  });

  it('blocks intake changes while locked', () => {
    assert.throws(
      () => assertGuardApplicationIntakeEditable(guard(), { phone: '555-9999' }),
      /locked after submission/
    );
  });

  it('allows intake changes when revision is open', () => {
    assert.doesNotThrow(() =>
      assertGuardApplicationIntakeEditable(
        guard({ applicationRevisionRequestedAt: '2026-07-21T00:00:00.000Z' }),
        { phone: '555-9999' }
      )
    );
  });

  it('allows staff bypass while locked', () => {
    assert.doesNotThrow(() =>
      assertGuardApplicationIntakeEditable(guard(), { phone: '555-9999' }, { staffBypass: true })
    );
  });

  it('locks pending client contact fields until revision', () => {
    assert.equal(isClientApplicationContactLocked(client()), true);
    assert.equal(
      isClientApplicationContactLocked(
        client({ applicationRevisionRequestedAt: '2026-07-21T00:00:00.000Z' })
      ),
      false
    );
    assert.equal(isClientApplicationContactLocked(client({ accountStatus: 'active', approved: true })), false);
  });

  it('blocks pending client contact edits while locked', () => {
    assert.throws(
      () => assertClientApplicationContactEditable(client(), { companyName: 'New Co' }),
      /locked after submission/
    );
  });
});
