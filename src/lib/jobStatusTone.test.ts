import assert from 'node:assert/strict';
import test from 'node:test';
import type { JobStatus } from '../types';
import { jobStatusLabel, jobStatusTone } from './jobStatusTone';

const ALL_STATUSES: JobStatus[] = [
  'draft',
  'pending-review',
  'open',
  'accepted',
  'in-progress',
  'completed',
  'cancelled',
  'closed',
];

test('jobStatusTone', async (t) => {
  await t.test('reads live work as info', () => {
    assert.equal(jobStatusTone('accepted'), 'info');
    assert.equal(jobStatusTone('in-progress'), 'info');
  });

  await t.test('reads finished work as positive', () => {
    assert.equal(jobStatusTone('completed'), 'positive');
  });

  await t.test('reads work waiting on a person as warning', () => {
    assert.equal(jobStatusTone('open'), 'warning');
    assert.equal(jobStatusTone('pending-review'), 'warning');
  });

  await t.test('reads a failed booking as negative', () => {
    assert.equal(jobStatusTone('cancelled'), 'negative');
  });

  await t.test('leaves inert states neutral', () => {
    assert.equal(jobStatusTone('draft'), 'neutral');
    assert.equal(jobStatusTone('closed'), 'neutral');
  });

  await t.test('covers every status', () => {
    for (const status of ALL_STATUSES) {
      assert.ok(jobStatusTone(status), `missing tone for ${status}`);
    }
  });
});

test('jobStatusLabel', async (t) => {
  await t.test('never leaks a raw slug', () => {
    for (const status of ALL_STATUSES) {
      const label = jobStatusLabel(status);
      assert.ok(!label.includes('-'), `${status} rendered as slug: ${label}`);
      assert.equal(label[0], label[0]?.toUpperCase());
    }
  });

  await t.test('formats multi-word statuses', () => {
    assert.equal(jobStatusLabel('in-progress'), 'In progress');
    assert.equal(jobStatusLabel('pending-review'), 'Pending review');
  });
});
