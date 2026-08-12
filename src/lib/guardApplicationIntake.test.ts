import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  guardApplicationCredentialVerificationBlocker,
  guardArmedPreferenceFromSignup,
  guardArmedPreferenceLabel,
  guardCardStatusLabel,
  guardHasApplicationIntake,
  listGuardUploadedCredentialLabels,
} from './guardApplicationIntake.ts';
import type { SecurityGuard } from '../types.ts';

function baseGuard(partial: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g-1',
    name: 'Test Guard',
    email: 'guard@example.com',
    badgeNumber: 'ICN-10001',
    avatar: '',
    phone: '555-0100',
    bio: 'Background',
    isArmed: false,
    backgroundChecked: false,
    verified: false,
    rating: 0,
    jobsCompleted: 0,
    certifications: [],
    experience: [],
    ...partial,
  };
}

describe('guardApplicationIntake', () => {
  it('maps armed signup preferences', () => {
    assert.deepEqual(guardArmedPreferenceFromSignup('unarmed'), {
      isArmed: false,
      armedPreference: 'unarmed',
    });
    assert.deepEqual(guardArmedPreferenceFromSignup('both'), {
      isArmed: true,
      armedPreference: 'both',
    });
  });

  it('labels armed preference from stored field', () => {
    assert.equal(guardArmedPreferenceLabel(baseGuard({ armedPreference: 'both' })), 'Armed & unarmed');
    assert.equal(guardArmedPreferenceLabel(baseGuard({ isArmed: true })), 'Armed');
  });

  it('labels guard card status', () => {
    assert.equal(guardCardStatusLabel('active'), 'Active CA guard card on hand');
  });

  it('detects application intake data', () => {
    assert.equal(guardHasApplicationIntake(baseGuard()), false);
    assert.equal(guardHasApplicationIntake(baseGuard({ yearsExperience: 2 })), true);
  });

  it('lists uploaded credential labels only when submitted', () => {
    assert.deepEqual(listGuardUploadedCredentialLabels(baseGuard()), []);
    assert.deepEqual(
      listGuardUploadedCredentialLabels(
        baseGuard({
          idVerificationStatus: 'pending',
          certifications: [
            {
              id: 'c1',
              name: 'Guard Card',
              issuer: 'BSIS',
              number: '1',
              status: 'pending',
              issueDate: '',
              expiryDate: '',
              imageUrl: 'scan.jpg',
            },
          ],
        })
      ),
      ['Government ID', 'BSIS Guard Card']
    );
  });

  it('blocks credential verification until application is approved', () => {
    const pendingGuard = baseGuard({ userStatus: 'pending' });
    assert.match(
      guardApplicationCredentialVerificationBlocker(pendingGuard, 'Guard Card') ?? '',
      /application must be approved/i
    );
    assert.equal(
      guardApplicationCredentialVerificationBlocker(
        baseGuard({ userStatus: 'approved' }),
        'Guard Card'
      ),
      null
    );
  });
});
