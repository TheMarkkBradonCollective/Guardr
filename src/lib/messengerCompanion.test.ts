import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  constrainClientViewToMessenger,
  constrainGuardTabToMessenger,
  constrainRouteToMessenger,
  constrainStaffSectionToMessenger,
  defaultMessengerRoute,
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
      { role: 'guard', websiteAccount: undefined, accountView: undefined, guardTab: 'messages' },
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
