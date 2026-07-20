import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatShiftStartsInCountdown,
  getGuardNextShift,
  isNextShiftCountdownActive,
} from './guardNextShift';
import { PRE_SHIFT_BRIEFING_UNLOCK_MS } from './preShiftBriefing';

test('getGuardNextShift picks soonest accepted assignment', () => {
  const later = {
    id: 'b',
    title: 'Later',
    status: 'accepted' as const,
    assignedGuardId: 'g1',
    startDate: '2026-07-21T20:00:00.000Z',
    endDate: '2026-07-21T22:00:00.000Z',
    location: 'B',
  };
  const sooner = {
    id: 'a',
    title: 'Sooner',
    status: 'accepted' as const,
    assignedGuardId: 'g1',
    startDate: '2026-07-20T18:00:00.000Z',
    endDate: '2026-07-20T22:00:00.000Z',
    location: 'A',
  };
  const other = {
    id: 'c',
    title: 'Other guard',
    status: 'accepted' as const,
    assignedGuardId: 'g2',
    startDate: '2026-07-20T10:00:00.000Z',
    endDate: '2026-07-20T12:00:00.000Z',
    location: 'C',
  };
  assert.equal(getGuardNextShift([later, sooner, other], 'g1')?.id, 'a');
});

test('formatShiftStartsInCountdown formats HH:MM:SS', () => {
  const start = '2026-07-20T18:00:00.000Z';
  const now = Date.parse('2026-07-20T15:30:05.000Z');
  assert.equal(formatShiftStartsInCountdown(start, now), '02:29:55');
});

test('formatShiftStartsInCountdown floors at zero after start', () => {
  const start = '2026-07-20T18:00:00.000Z';
  const now = Date.parse('2026-07-20T19:00:00.000Z');
  assert.equal(formatShiftStartsInCountdown(start, now), '00:00:00');
});

test('isNextShiftCountdownActive opens 24h before start', () => {
  const start = '2026-07-20T18:00:00.000Z';
  const startMs = Date.parse(start);
  assert.equal(
    isNextShiftCountdownActive(start, startMs - PRE_SHIFT_BRIEFING_UNLOCK_MS - 1),
    false
  );
  assert.equal(
    isNextShiftCountdownActive(start, startMs - PRE_SHIFT_BRIEFING_UNLOCK_MS),
    true
  );
  assert.equal(isNextShiftCountdownActive(start, startMs + 60_000), true);
});
