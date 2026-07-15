import test from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard } from '../types';
import { resolveGuardPayForJob } from './differentialPay';

function guard(): SecurityGuard {
  return {
    id: 'g1',
    name: 'Guard',
    email: 'g@test.com',
    badgeNumber: '1',
    avatar: '',
    phone: '',
    bio: '',
    isArmed: false,
    backgroundChecked: true,
    verified: true,
    rating: 5,
    jobsCompleted: 0,
    listedWeaponGear: ['flashlight'],
    certifications: [],
  } as SecurityGuard;
}

test('resolveGuardPayForJob uses tier rate when configured', () => {
  const pay = resolveGuardPayForJob(
    {
      hourlyRate: 30,
      guardPay: 25,
      tierPayRates: { unarmed: 28, lightArmed: 32, armed: 40 },
      state: 'CA',
    },
    guard()
  );
  assert.equal(pay, 28);
});
