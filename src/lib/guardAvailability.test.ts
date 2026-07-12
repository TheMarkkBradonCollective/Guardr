import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultAvailabilitySlots,
  isInvalidAvailabilityWindow,
  loadAvailabilitySlots,
  saveAvailabilitySlots,
} from './guardAvailability.ts';

describe('isInvalidAvailabilityWindow', () => {
  it('flags end time equal to start time', () => {
    assert.equal(isInvalidAvailabilityWindow({ startTime: '09:00', endTime: '09:00' }), true);
  });

  it('flags end time before start time', () => {
    assert.equal(isInvalidAvailabilityWindow({ startTime: '17:00', endTime: '09:00' }), true);
  });

  it('allows end time after start time', () => {
    assert.equal(isInvalidAvailabilityWindow({ startTime: '08:00', endTime: '18:00' }), false);
  });

  it('does not flag incomplete slots', () => {
    assert.equal(isInvalidAvailabilityWindow({ startTime: '', endTime: '' }), false);
  });
});

describe('defaultAvailabilitySlots', () => {
  it('returns weekday slots that are all valid windows', () => {
    const slots = defaultAvailabilitySlots('guard-1');
    assert.equal(slots.length, 5);
    for (const slot of slots) {
      assert.equal(isInvalidAvailabilityWindow(slot), false);
    }
  });
});

describe('load/saveAvailabilitySlots (no localStorage in this test environment)', () => {
  it('loadAvailabilitySlots returns null without throwing', () => {
    assert.equal(loadAvailabilitySlots('guard-1'), null);
  });

  it('saveAvailabilitySlots does not throw', () => {
    assert.doesNotThrow(() => saveAvailabilitySlots('guard-1', defaultAvailabilitySlots('guard-1')));
  });
});
