import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clientMapPinKind,
  guardMapPinKind,
  staffMapPinKind,
  staffVisibleMapJobs,
  clientBrowseMapJobs,
} from './mapJobVisibility';
import type { SecurityRequest } from '../types';

function futureIso(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

function job(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    id: 'j1',
    title: 'Coverage',
    clientId: 'c1',
    clientName: 'Client',
    location: 'LA',
    startDate: futureIso(4),
    endDate: futureIso(8),
    status: 'open',
    assignedGuardId: null,
    applicants: [],
    ...overrides,
  } as SecurityRequest;
}

test('guard map excludes past and canceled', () => {
  assert.equal(guardMapPinKind('g1', job({ status: 'completed', assignedGuardId: 'g1' })), null);
  assert.equal(guardMapPinKind('g1', job({ status: 'cancelled', assignedGuardId: 'g1' })), null);
  assert.equal(
    guardMapPinKind('g1', job({ status: 'accepted', assignedGuardId: 'g1' })),
    'scheduled'
  );
});

test('guard map marks direct client requests', () => {
  assert.equal(
    guardMapPinKind(
      'g1',
      job({ status: 'open', requestType: 'direct', targetGuardId: 'g1' })
    ),
    'direct'
  );
});

test('client map excludes past and canceled', () => {
  assert.equal(clientMapPinKind(job({ status: 'completed', clientId: 'c1' })), null);
  assert.equal(clientMapPinKind(job({ status: 'cancelled', clientId: 'c1' })), null);
  assert.equal(clientMapPinKind(job({ status: 'accepted', clientId: 'c1', assignedGuardId: 'g1' })), 'upcoming');
});

test('staff map only includes active upcoming jobs', () => {
  const list = staffVisibleMapJobs([
    job({ id: 'open', status: 'open' }),
    job({ id: 'live', status: 'in-progress', assignedGuardId: 'g1' }),
    job({ id: 'done', status: 'completed', assignedGuardId: 'g1' }),
    job({ id: 'cancel', status: 'cancelled' }),
  ]);
  assert.deepEqual(
    list.map((j) => j.id).sort(),
    ['live', 'open']
  );
  assert.equal(staffMapPinKind(job({ status: 'completed' })), null);
});

test('clientBrowseMapJobs only returns owned active jobs', () => {
  const list = clientBrowseMapJobs('c1', 'Client', [
    job({ id: 'mine-open', clientId: 'c1', clientName: 'Client', status: 'open' }),
    job({ id: 'mine-done', clientId: 'c1', clientName: 'Client', status: 'completed' }),
    job({ id: 'other', clientId: 'c2', clientName: 'Other Co', status: 'open' }),
  ]);
  assert.deepEqual(
    list.map((j) => j.id),
    ['mine-open']
  );
});
