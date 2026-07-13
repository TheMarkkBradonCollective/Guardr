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
    assert.equal(payloads[0].url, undefined);
  });

  it('targets assignment guardId when provided', async () => {
    const payloads = await buildEventDispatchPayloads(mockDb(), {
      type: 'assignment',
      guardId: 'guard-3',
      requestId: 'job-1',
    });

    assert.equal(payloads.length, 1);
    assert.equal(payloads[0].userId, 'guard-3');
    assert.equal(payloads[0].url, undefined);
  });

  it('routes guard applications to staff and the job client when recipientUserId is set', async () => {
    const payloads = await buildEventDispatchPayloads(mockDb(), {
      type: 'guard_application',
      recipientUserId: 'client-3',
      requestId: 'job-8',
      body: 'Alex applied for "Warehouse patrol".',
    });

    assert.equal(payloads.length, 2);
    assert.equal(payloads[0].role, 'dispatch');
    assert.equal(payloads[1].userId, 'client-3');
    assert.equal(payloads[1].url, undefined);
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

  it('notifies ticket owner on support status changes', async () => {
    const payloads = await buildEventDispatchPayloads(mockDb(), {
      type: 'support_ticket_status',
      recipientUserId: 'client-2',
      ticketId: 'ticket-1',
      body: 'Your ticket was marked resolved.',
    });

    assert.equal(payloads.length, 1);
    assert.equal(payloads[0].userId, 'client-2');
  });

  it('notifies staff on new support tickets', async () => {
    const payloads = await buildEventDispatchPayloads(mockDb(), {
      type: 'support_ticket',
      ticketId: 'ticket-9',
      body: 'New formal report from Alex',
    });

    assert.equal(payloads.length, 1);
    assert.equal(payloads[0].role, 'dispatch');
  });

  it('notifies guard, client, and staff on dispute updates', async () => {
    const payloads = await buildEventDispatchPayloads(mockDb(), {
      type: 'dispute_update',
      ticketId: 'ticket-3',
      guardId: 'guard-1',
      clientId: 'client-2',
      body: 'Payout approved for Warehouse shift',
    });

    assert.equal(payloads.length, 3);
    assert.deepEqual(
      payloads.map((p) => p.userId ?? p.role),
      ['dispatch', 'guard-1', 'client-2']
    );
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

  it('broadcasts client chat to all clients with sender exclusion support', async () => {
    const payloads = await buildEventDispatchPayloads(mockDb(), {
      type: 'client_message',
      body: 'Hello clients',
      excludeUserId: 'client-sender',
    });

    assert.equal(payloads.length, 1);
    assert.equal(payloads[0].role, 'client');
    assert.equal(payloads[0].excludeUserId, 'client-sender');
  });

  it('targets guard trusted status to the guard recipient', async () => {
    const payloads = await buildEventDispatchPayloads(mockDb(), {
      type: 'guard_trusted_status',
      recipientUserId: 'guard-7',
      guardId: 'guard-7',
      title: 'You are now a trusted guard',
      body: 'You can coordinate crews.',
    });

    assert.equal(payloads.length, 1);
    assert.equal(payloads[0].userId, 'guard-7');
  });

  it('targets job relisted notifications to the client', async () => {
    const payloads = await buildEventDispatchPayloads(mockDb(), {
      type: 'job_relisted',
      recipientUserId: 'client-4',
      requestId: 'job-9',
      body: 'Your job is back on the marketplace.',
    });

    assert.equal(payloads.length, 1);
    assert.equal(payloads[0].userId, 'client-4');
  });

  it('targets schedule change notifications to the assigned guard', async () => {
    const payloads = await buildEventDispatchPayloads(mockDb(), {
      type: 'job_schedule_changed',
      recipientUserId: 'guard-5',
      requestId: 'job-2',
      body: 'Your job time has changed',
    });

    assert.equal(payloads.length, 1);
    assert.equal(payloads[0].userId, 'guard-5');
  });

  it('targets crew chat to a specific guard or staff dispatch', async () => {
    const direct = await buildEventDispatchPayloads(mockDb(), {
      type: 'team_chat_message',
      recipientUserId: 'guard-2',
      requestId: 'job-3',
      body: 'Coordinator: meet at north gate',
    });
    assert.equal(direct.length, 1);
    assert.equal(direct[0].userId, 'guard-2');

    const staff = await buildEventDispatchPayloads(mockDb(), {
      type: 'team_chat_message',
      requestId: 'job-3',
      body: 'Coordinator: meet at north gate',
    });
    assert.equal(staff.length, 1);
    assert.equal(staff[0].role, 'dispatch');
  });

  it('targets account_update to the recipient user', async () => {
    const payloads = await buildEventDispatchPayloads(mockDb(), {
      type: 'account_update',
      recipientUserId: 'guard-4',
      title: 'Credential verified',
      body: 'Your guard card was verified.',
    });

    assert.equal(payloads.length, 1);
    assert.equal(payloads[0].userId, 'guard-4');
  });

  it('notifies dispatch, client, and guard on job_status_update', async () => {
    const payloads = await buildEventDispatchPayloads(mockDb(), {
      type: 'job_status_update',
      requestId: 'job-5',
      clientId: 'client-2',
      guardId: 'guard-3',
      title: 'Job cancelled',
      body: 'The shift was cancelled.',
    });

    assert.equal(payloads.length, 3);
    assert.deepEqual(
      payloads.map((p) => p.userId ?? p.role),
      ['dispatch', 'client-2', 'guard-3']
    );
  });

  it('targets payout_ready to the guard recipient', async () => {
    const payloads = await buildEventDispatchPayloads(mockDb(), {
      type: 'payout_ready',
      recipientUserId: 'guard-8',
      guardId: 'guard-8',
      requestId: 'job-12',
      title: 'Payout ready',
      body: '$120.00 is ready to collect.',
    });

    assert.equal(payloads.length, 1);
    assert.equal(payloads[0].userId, 'guard-8');
  });
});
