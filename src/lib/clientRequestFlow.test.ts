import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { serviceToJobType } from './clientRequestFlow.ts';

describe('serviceToJobType', () => {
  it('maps specific client services to dedicated job types', () => {
    assert.equal(serviceToJobType('nightclub-bar'), 'nightclub-bar');
    assert.equal(serviceToJobType('event-wedding'), 'event-wedding');
    assert.equal(serviceToJobType('event-concert'), 'event-concert');
    assert.equal(serviceToJobType('construction'), 'construction');
    assert.equal(serviceToJobType('fire-watch'), 'fire-watch');
    assert.equal(serviceToJobType('standing-guard'), 'standing-guard');
    assert.equal(serviceToJobType('event-other'), 'event');
  });
});
