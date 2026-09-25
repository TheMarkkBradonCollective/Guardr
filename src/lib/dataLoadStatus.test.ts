import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getDataLoadIssue,
  rosterRequestStatus,
  setDataLoadIssue,
  subscribeDataLoadIssue,
} from './dataLoadStatus.ts';

describe('dataLoadStatus', () => {
  it('notifies subscribers when the roster load issue changes', () => {
    setDataLoadIssue(null);
    const seen: Array<string | null> = [];
    const stop = subscribeDataLoadIssue((value) => seen.push(value));
    setDataLoadIssue('Could not load Guardr.');
    setDataLoadIssue(null);
    stop();
    assert.equal(getDataLoadIssue(), null);
    assert.deepEqual(seen, [null, 'Could not load Guardr.', null]);
  });

  it('treats a failed load with an empty list as an error, not an empty state', () => {
    assert.equal(rosterRequestStatus(0, 'Could not load Guardr.'), 'error');
    assert.equal(rosterRequestStatus(0, null), 'empty');
    assert.equal(rosterRequestStatus(3, 'Could not load Guardr.'), 'ready');
  });
});
