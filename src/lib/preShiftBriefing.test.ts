import test from 'node:test';
import assert from 'node:assert/strict';
import {
  activePreShiftBriefingReminderTier,
  canGuardStartEnRoute,
  evaluatePreShiftBriefingReminder,
  guardCanOpenPreShiftBriefing,
  isPreShiftBriefingWindowOpen,
  msUntilEnRouteUnlock,
  PRE_SHIFT_BRIEFING_UNLOCK_MS,
  PRE_SHIFT_EN_ROUTE_UNLOCK_MS,
} from './preShiftBriefing';

const HOUR = 60 * 60 * 1000;

function job(startDate: string) {
  return {
    status: 'accepted' as const,
    assignedGuardId: 'guard-1',
    startDate,
    enRouteAt: undefined,
    checkInAudit: undefined,
  };
}

test('briefing window opens 24 hours before shift start', () => {
  const start = new Date('2026-07-16T20:00:00.000Z');
  const req = job(start.toISOString());

  assert.equal(
    isPreShiftBriefingWindowOpen(req, start.getTime() - PRE_SHIFT_BRIEFING_UNLOCK_MS - 1),
    false
  );
  assert.equal(
    isPreShiftBriefingWindowOpen(req, start.getTime() - PRE_SHIFT_BRIEFING_UNLOCK_MS),
    true
  );
  assert.equal(isPreShiftBriefingWindowOpen(req, start.getTime() - 2 * HOUR), true);
});

test('en route unlocks only within 1 hour of shift start', () => {
  const start = new Date('2026-07-16T20:00:00.000Z');
  const req = job(start.toISOString());

  assert.equal(canGuardStartEnRoute(req, start.getTime() - 2 * HOUR), false);
  assert.equal(canGuardStartEnRoute(req, start.getTime() - PRE_SHIFT_EN_ROUTE_UNLOCK_MS), true);
  assert.equal(canGuardStartEnRoute(req, start.getTime() - 15 * 60 * 1000), true);
});

test('reminder tiers map to countdown windows', () => {
  assert.equal(activePreShiftBriefingReminderTier(11 * HOUR), '12h');
  assert.equal(activePreShiftBriefingReminderTier(6 * HOUR), '6h');
  assert.equal(activePreShiftBriefingReminderTier(2 * HOUR), '3h');
  assert.equal(activePreShiftBriefingReminderTier(45 * 60 * 1000), '1h');
  assert.equal(activePreShiftBriefingReminderTier(20 * 60 * 1000), '30m');
  assert.equal(activePreShiftBriefingReminderTier(25 * HOUR), null);
});

test('evaluatePreShiftBriefingReminder skips after en route', () => {
  const start = new Date('2026-07-16T20:00:00.000Z');
  const req = {
    ...job(start.toISOString()),
    enRouteAt: new Date().toISOString(),
  };
  assert.equal(evaluatePreShiftBriefingReminder(req, start.getTime() - 30 * 60 * 1000), null);
});

test('evaluatePreShiftBriefingReminder skips after arrived', () => {
  const start = new Date('2026-07-16T20:00:00.000Z');
  const req = {
    ...job(start.toISOString()),
    arrivedAt: new Date().toISOString(),
  };
  assert.equal(evaluatePreShiftBriefingReminder(req, start.getTime() - 30 * 60 * 1000), null);
});

test('canGuardStartEnRoute blocks after arrived', () => {
  const start = new Date('2026-07-16T20:00:00.000Z');
  const req = {
    ...job(start.toISOString()),
    arrivedAt: new Date().toISOString(),
  };
  assert.equal(canGuardStartEnRoute(req, start.getTime() - 15 * 60 * 1000), false);
});

test('msUntilEnRouteUnlock counts down to one hour before start', () => {
  const start = new Date('2026-07-16T20:00:00.000Z');
  const now = start.getTime() - 90 * 60 * 1000;
  assert.equal(msUntilEnRouteUnlock(start.toISOString(), now), 30 * 60 * 1000);
});

test('guardCanOpenPreShiftBriefing requires assignment within briefing window', () => {
  const start = new Date('2026-07-16T20:00:00.000Z');
  const req = { ...job(start.toISOString()), assignedGuardId: 'guard-1' as string };
  assert.equal(
    guardCanOpenPreShiftBriefing(req, 'guard-1', start.getTime() - PRE_SHIFT_BRIEFING_UNLOCK_MS),
    true
  );
  assert.equal(guardCanOpenPreShiftBriefing(req, 'other-guard', start.getTime() - 2 * HOUR), false);
});
