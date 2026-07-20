import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMissionTimeline, inferMissionPhase } from './missionTracking';
import type { SecurityRequest } from '../types';

function baseJob(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    id: 'job-1',
    title: 'Lobby coverage',
    clientId: 'client-1',
    clientName: 'Client',
    location: '123 Main',
    startDate: '2026-07-20T18:00:00.000Z',
    endDate: '2026-07-20T22:00:00.000Z',
    status: 'accepted',
    assignedGuardId: 'guard-1',
    applicants: ['guard-1'],
    ...overrides,
  } as SecurityRequest;
}

test('inferMissionPhase prefers arrived over en-route', () => {
  assert.equal(
    inferMissionPhase(baseJob({ enRouteAt: '2026-07-20T17:00:00.000Z' })),
    'en-route'
  );
  assert.equal(
    inferMissionPhase(
      baseJob({
        enRouteAt: '2026-07-20T17:00:00.000Z',
        arrivedAt: '2026-07-20T17:30:00.000Z',
      })
    ),
    'on-site'
  );
});

test('buildMissionTimeline separates arrived and on-duty timestamps', () => {
  const timeline = buildMissionTimeline(
    baseJob({
      enRouteAt: '2026-07-20T17:00:00.000Z',
      arrivedAt: '2026-07-20T17:30:00.000Z',
      status: 'in-progress',
      checkInAudit: {
        checkedAt: '2026-07-20T17:45:00.000Z',
        gpsVerified: true,
        uniform: {
          uniformPresent: true,
          blackShoes: true,
          dutyBelt: true,
          nameBadge: true,
          professionalAppearance: true,
        },
        equipment: { radio: true, flashlight: true, requiredEquipment: true },
        selfieUpload: 'x',
        readyForDuty: true,
      },
    })
  );

  const arrived = timeline.find((s) => s.step === 'arrived');
  const onDuty = timeline.find((s) => s.step === 'on-duty');
  assert.equal(arrived?.timestamp, '2026-07-20T17:30:00.000Z');
  assert.equal(onDuty?.timestamp, '2026-07-20T17:45:00.000Z');
  assert.equal(onDuty?.active, true);
});
