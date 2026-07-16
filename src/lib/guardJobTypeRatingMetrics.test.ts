import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildJobTypeRatingCards,
  getJobTypeRatingCard,
  jobTypeRatingCategory,
  jobTypeRatingDisplayName,
} from './guardJobTypeRatingMetrics.ts';
import type { SecurityRequest } from '../types.ts';

function completedJob(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    id: 'job-1',
    title: 'Corporate event',
    type: 'event-corporate',
    status: 'completed',
    assignedGuardId: 'guard-1',
    startDate: '2026-01-01T18:00:00',
    endDate: '2026-01-01T22:00:00',
    location: 'LA',
    clientId: 'client-1',
    clientName: 'Client',
    hourlyRate: 30,
    guardPay: 25,
    durationHours: 4,
    estimatedPayout: 100,
    ...overrides,
  } as SecurityRequest;
}

test('jobTypeRatingCategory maps corporate events to events profile', () => {
  assert.equal(jobTypeRatingCategory('event-corporate'), 'events');
  assert.equal(jobTypeRatingCategory('nightclub-bar'), 'nightlife');
  assert.equal(jobTypeRatingCategory('patrol'), 'sites');
});

test('jobTypeRatingDisplayName returns short hero labels', () => {
  assert.equal(jobTypeRatingDisplayName('event-corporate'), 'Corporate events');
  assert.equal(jobTypeRatingDisplayName('nightclub-bar'), 'Nightlife');
});

test('buildJobTypeRatingCards returns category-specific labels and zero-state values', () => {
  const cards = buildJobTypeRatingCards('guard-1', 'event-corporate', []);

  assert.ok(cards.length >= 5);
  assert.ok(cards.some((card) => card.label === 'Post check-ins'));
  assert.equal(cards.find((card) => card.id === 'on-time')?.valueDisplay, '0%');
  assert.equal(cards.find((card) => card.id === 'lifetime-shifts')?.valueDisplay, '0');
});

test('buildJobTypeRatingCards uses nightlife labels for nightclub-bar', () => {
  const cards = buildJobTypeRatingCards('guard-1', 'nightclub-bar', []);

  assert.ok(cards.some((card) => card.label === 'Door readiness'));
  assert.ok(cards.some((card) => card.label === 'Venue check-ins'));
});

test('getJobTypeRatingCard returns a single metric card', () => {
  const requests = [completedJob({ id: 'j1', ratingGiven: 5 })];
  const card = getJobTypeRatingCard('guard-1', 'event-corporate', 'client-rating', requests);

  assert.ok(card);
  assert.equal(card?.valueDisplay, '5.0 ★');
});
