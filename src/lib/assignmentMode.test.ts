import test from 'node:test';
import assert from 'node:assert/strict';
import { jobUsesFirstToAccept, resolveAssignmentMode } from './assignmentMode';

test('resolveAssignmentMode prefers job setting over client default', () => {
  assert.equal(
    resolveAssignmentMode({ assignmentMode: 'first-to-accept' }, { defaultAssignmentMode: 'client-approve' }),
    'first-to-accept'
  );
});

test('jobUsesFirstToAccept falls back to client default', () => {
  assert.equal(jobUsesFirstToAccept({}, { defaultAssignmentMode: 'first-to-accept' }), true);
});
