import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isMessagingNotificationType,
  messengerUrlFromAppUrl,
  notificationChannelForType,
  parsePushAppChannel,
  selectSubscriptionsForNotification,
} from './notificationChannel.ts';

describe('notificationChannelForType', () => {
  it('routes conversation types to Messenger', () => {
    for (const type of [
      'support_message',
      'job_chat_message',
      'staff_message',
      'guard_message',
      'client_message',
      'team_chat_message',
      'support_ticket',
      'support_ticket_status',
    ]) {
      assert.equal(notificationChannelForType(type), 'messenger', type);
      assert.equal(isMessagingNotificationType(type), true, type);
    }
  });

  it('routes platform types to the main app', () => {
    for (const type of ['assignment', 'account_update', 'payout_ready', 'job_open_to_guards', 'emergency_alert']) {
      assert.equal(notificationChannelForType(type), 'main', type);
      assert.equal(isMessagingNotificationType(type), false, type);
    }
  });
});

describe('selectSubscriptionsForNotification', () => {
  const main = { endpoint: 'main', app_channel: 'main' as const };
  const messenger = { endpoint: 'msg', app_channel: 'messenger' as const };
  const legacy = { endpoint: 'legacy', app_channel: undefined as string | undefined };

  it('sends messages only to Messenger when a Messenger subscription exists', () => {
    const chosen = selectSubscriptionsForNotification([main, messenger, legacy], 'job_chat_message');
    assert.deepEqual(chosen.map((s) => s.endpoint), ['msg']);
  });

  it('falls back to the main app when Messenger is not installed', () => {
    const chosen = selectSubscriptionsForNotification([main, legacy], 'job_chat_message');
    assert.deepEqual(
      chosen.map((s) => s.endpoint).sort(),
      ['legacy', 'main'],
    );
  });

  it('never delivers platform alerts to Messenger', () => {
    const chosen = selectSubscriptionsForNotification([main, messenger, legacy], 'assignment');
    assert.deepEqual(
      chosen.map((s) => s.endpoint).sort(),
      ['legacy', 'main'],
    );
  });
});

describe('parsePushAppChannel', () => {
  it('defaults unknown values to main', () => {
    assert.equal(parsePushAppChannel('messenger'), 'messenger');
    assert.equal(parsePushAppChannel('main'), 'main');
    assert.equal(parsePushAppChannel(undefined), 'main');
    assert.equal(parsePushAppChannel('other'), 'main');
  });
});

describe('messengerUrlFromAppUrl', () => {
  it('keeps query params on the companion path', () => {
    assert.equal(messengerUrlFromAppUrl('/guard/messages?st=t1'), '/messenger?st=t1');
    assert.equal(messengerUrlFromAppUrl('/staff/messages'), '/messenger');
  });
});
