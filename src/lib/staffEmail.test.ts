import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertStaffPersonalEmailAvailable,
  assertStaffPersonalEmailDistinctFromWork,
  normalizeStaffEmail,
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
