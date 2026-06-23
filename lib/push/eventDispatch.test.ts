import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildEventDispatchPayloads } from './eventDispatch.ts';

function mockDb(job?: { client_id: string; assigned_guard_id: string } | null) {
  return {
    from(table: string) {
      if (table !== 'security_requests') {
        throw new Error(`Unexpected table ${table}`);
      }
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        maybeSingle: async () => ({ data: job ?? null, error: null }),
      };
    },
  } as never;
}

describe('buildEventDispatchPayloads', () => {
  it('targets assignment recipientUserId instead of broadcasting to all guards', async () => {
    const payloads = await buildEventDispatchPayloads(mockDb(), {
      type: 'assignment',
      recipientUserId: 'client-9',
      requestId: 'job-1',
      body: 'Confirm to hire them.',
    });

    assert.equal(payloads.length, 1);
    assert.equal(payloads[0].userId, 'client-9');
    assert.equal(payloads[0].role, undefined);
  });

  it('targets assignment guardId when provided', async () => {
    const payloads = await buildEventDispatchPayloads(mockDb(), {
      type: 'assignment',
      guardId: 'guard-3',
      requestId: 'job-1',
    });

    assert.equal(payloads.length, 1);
    assert.equal(payloads[0].userId, 'guard-3');
  });

  it('notifies guard, client, and dispatch on emergencies with a job id', async () => {
    const payloads = await buildEventDispatchPayloads(
      mockDb({ client_id: 'client-1', assigned_guard_id: 'guard-2' }),
      {
        type: 'emergency_alert',
        requestId: 'job-1',
        body: 'Incident reported',
      }
    );

    assert.equal(payloads.length, 3);
    assert.deepEqual(
      payloads.map((p) => p.userId ?? p.role),
      ['dispatch', 'guard-2', 'client-1']
    );
    assert.equal(payloads[0].priority, 'high');
  });

  it('notifies dispatch and the assigned guard on missed check-ins', async () => {
    const payloads = await buildEventDispatchPayloads(mockDb(), {
      type: 'missed_checkin',
      guardId: 'guard-7',
      guardName: 'Alex',
      requestId: 'job-9',
      location: 'Warehouse',
    });

    assert.equal(payloads.length, 2);
    assert.equal(payloads[0].role, 'dispatch');
    assert.equal(payloads[1].userId, 'guard-7');
    assert.match(payloads[1].body ?? '', /missed your hourly check-in/i);
  });

  it('broadcasts guard chat to all guards with sender exclusion support', async () => {
    const payloads = await buildEventDispatchPayloads(mockDb(), {
      type: 'guard_message',
      body: 'Hello team',
      excludeUserId: 'guard-sender',
    });

    assert.equal(payloads.length, 1);
    assert.equal(payloads[0].role, 'guard');
    assert.equal(payloads[0].excludeUserId, 'guard-sender');
  });
});
