import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertStaffPersonalEmailAvailable,
  assertStaffPersonalEmailDistinctFromWork,
  normalizeStaffEmail,
  staffLoginEmailMatches,
} from './staffEmail';

test('normalizes staff emails', () => {
  assert.equal(normalizeStaffEmail('  Name@Example.COM '), 'name@example.com');
});

test('rejects personal email that matches another login email', () => {
  assert.throws(
    () =>
      assertStaffPersonalEmailAvailable('guard@example.com', [
        { id: 'guard-1', email: 'guard@example.com' },
      ]),
    /already used as a sign-in email/
  );
});

test('rejects personal email identical to work email', () => {
  assert.throws(
    () => assertStaffPersonalEmailDistinctFromWork('work@signaturesecurityspecialist.com', 'work@signaturesecurityspecialist.com'),
    /different from your work email/
  );
});

test('matches staff login on work or personal email', () => {
  const member = {
    email: 'r.brown@signaturesecurityspecialist.com',
    personalEmail: 'brownrebekah211525@gmail.com',
  };
  assert.equal(staffLoginEmailMatches(member, 'r.brown@signaturesecurityspecialist.com'), true);
  assert.equal(staffLoginEmailMatches(member, 'brownrebekah211525@gmail.com'), true);
  assert.equal(staffLoginEmailMatches(member, 'other@example.com'), false);
});
