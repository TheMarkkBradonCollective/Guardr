import assert from 'node:assert/strict';
import test from 'node:test';
import { isClientViewAllowedForType } from './clientProductModules';
import { getStaffOverviewConfig, STAFF_CONTROL_CENTER_KICKER } from './staffOverviewConfig';
import { isStaffNavSectionAccessible } from './staffNavAccess';

const CLIENT_TYPES = ['personal', 'business', 'security-company'] as const;

test('every client type can open Messages on web and Messenger', () => {
  for (const clientType of CLIENT_TYPES) {
    assert.equal(isClientViewAllowedForType('messages', clientType), true, clientType);
    assert.equal(isClientViewAllowedForType('home', clientType), true, clientType);
  }
  assert.equal(isClientViewAllowedForType('map', 'security-company'), false);
  assert.equal(isClientViewAllowedForType('operations', 'security-company'), true);
  assert.equal(isClientViewAllowedForType('roster', 'security-company'), true);
});

test('staff ladder roles use staff control center kicker except support and finance', () => {
  for (const role of ['moderator', 'administrator', 'manager', 'director', 'owner'] as const) {
    assert.equal(getStaffOverviewConfig(role).workspaceKicker, STAFF_CONTROL_CENTER_KICKER, role);
  }
  assert.equal(getStaffOverviewConfig('support').workspaceKicker, 'Support workspace');
  assert.equal(getStaffOverviewConfig('finance').workspaceKicker, 'Finance desk');
});

test('staff director reaches core ops sections when finance flags allow', () => {
  const directorFlags = {
    showFinance: true,
    showPayments: true,
    showSettings: true,
    showPermissions: true,
    showDisputes: true,
    showCities: true,
    showManagement: true,
    financeDeskOnly: false,
  };
  for (const section of ['overview', 'applications', 'messages', 'support'] as const) {
    assert.equal(isStaffNavSectionAccessible(section, directorFlags), true, section);
  }
});
