import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MESSENGER_PATH,
  buildMessengerPath,
  isMessengerPath,
  messengerPathFromNotification,
  shouldOpenInMessenger,
  shouldPersistMessengerInstall,
  toMessengerDeepLink,
} from './messengerCompanion.ts';

describe('messenger paths', () => {
  it('detects the companion route', () => {
    assert.equal(isMessengerPath('/messenger'), true);
    assert.equal(isMessengerPath('/messenger?st=1'), true);
    assert.equal(isMessengerPath('/guard/messages'), false);
    assert.equal(isMessengerPath('/'), false);
  });

  it('builds query-preserving companion URLs', () => {
    assert.equal(buildMessengerPath(), MESSENGER_PATH);
    assert.equal(buildMessengerPath({ st: 't1', jc: 'job-1' }), '/messenger?st=t1&jc=job-1');
  });

  it('maps a notification onto Messenger', () => {
    assert.equal(
      messengerPathFromNotification({ type: 'job_chat_message', requestId: 'job-1' }),
      '/messenger?jc=job-1&chat=1&type=job_chat_message',
    );
    assert.equal(
      messengerPathFromNotification({ type: 'support_message', ticketId: 't1' }),
      '/messenger?st=t1&type=support_message',
    );
  });

  it('rewrites role-app message URLs onto Messenger', () => {
    assert.equal(toMessengerDeepLink('/guard/messages?st=t1'), '/messenger?st=t1');
    assert.equal(toMessengerDeepLink('/staff/messages?mtab=jobs&jc=job-1'), '/messenger?mtab=jobs&jc=job-1');
  });

  it('opens messaging types in Messenger only when the companion is available', () => {
    assert.equal(shouldOpenInMessenger('job_chat_message', true), true);
    assert.equal(shouldOpenInMessenger('job_chat_message', false), false);
    assert.equal(shouldOpenInMessenger('assignment', true), false);
  });

  it('persists Messenger install only from a dedicated shell', () => {
    assert.equal(
      shouldPersistMessengerInstall({
        messengerExperience: false,
        standalone: false,
        messengerPath: true,
      }),
      false,
    );
    assert.equal(
      shouldPersistMessengerInstall({
        messengerExperience: false,
        standalone: true,
        messengerPath: true,
      }),
      true,
    );
    assert.equal(
      shouldPersistMessengerInstall({
        messengerExperience: true,
        standalone: false,
        messengerPath: false,
      }),
      true,
    );
  });
});
