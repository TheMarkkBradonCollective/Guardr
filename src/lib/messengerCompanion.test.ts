import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MESSENGER_PATH,
  buildMessengerPath,
  constrainClientViewToMessenger,
  constrainGuardTabToMessenger,
  constrainRouteToMessenger,
  constrainStaffSectionToMessenger,
  defaultMessengerRoute,
  isMessengerPath,
  messengerPathFromNotification,
  shouldOpenInMessenger,
  shouldPersistMessengerInstall,
  toMessengerDeepLink,
} from './messengerCompanion.ts';

describe('Messenger companion routes', () => {
  it('lands each role on messages', () => {
    assert.deepEqual(defaultMessengerRoute('guard'), { role: 'guard', guardTab: 'messages' });
    assert.deepEqual(defaultMessengerRoute('client'), { role: 'client', clientView: 'messages' });
    assert.deepEqual(defaultMessengerRoute('staff'), { role: 'staff', staffSection: 'messages' });
  });

  it('keeps support and account chrome, and sends ops destinations to messages', () => {
    assert.equal(constrainGuardTabToMessenger('support'), 'support');
    assert.equal(constrainGuardTabToMessenger('settings'), 'settings');
    assert.equal(constrainGuardTabToMessenger('map'), 'messages');
    assert.equal(constrainGuardTabToMessenger('myJobs'), 'messages');
    assert.equal(constrainGuardTabToMessenger('activation'), 'messages');

    assert.equal(constrainClientViewToMessenger('support-compose'), 'support-compose');
    assert.equal(constrainClientViewToMessenger('home'), 'messages');
    assert.equal(constrainClientViewToMessenger('request'), 'messages');

    assert.equal(constrainStaffSectionToMessenger('support'), 'support');
    assert.equal(constrainStaffSectionToMessenger('overview'), 'messages');
    assert.equal(constrainStaffSectionToMessenger('jobs'), 'messages');
    assert.equal(constrainStaffSectionToMessenger('team-chat'), 'messages');
    assert.equal(constrainStaffSectionToMessenger('job-chats'), 'messages');
  });

  it('strips website account and ops paths from signed-in Messenger routes', () => {
    assert.deepEqual(
      constrainRouteToMessenger({ role: 'guard', websiteAccount: true, accountView: 'home', guardTab: 'map' }),
      { role: 'guard', websiteAccount: undefined, accountView: undefined, guardTab: 'messages', messengerCompanion: true },
    );
    assert.equal(
      constrainRouteToMessenger({ role: 'client', clientView: 'support' }).clientView,
      'support',
    );
    assert.equal(
      constrainRouteToMessenger({ role: 'staff', staffSection: 'map' }).staffSection,
      'messages',
    );
    assert.equal(
      constrainRouteToMessenger({ role: 'staff', authView: 'sign-in' }).authView,
      'sign-in',
    );
  });
});

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
