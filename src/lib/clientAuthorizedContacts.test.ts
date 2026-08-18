import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  contactRolesForClientType,
  parseAuthorizedContacts,
} from './clientAuthorizedContacts';

describe('clientAuthorizedContacts', () => {
  it('uses family/emergency roles for personal and manager roles for business', () => {
    assert.deepEqual(
      contactRolesForClientType('personal').map((r) => r.id),
      ['family', 'emergency', 'contact']
    );
    assert.deepEqual(
      contactRolesForClientType('business').map((r) => r.id),
      ['owner', 'manager', 'employee', 'contact']
    );
  });

  it('parses stored contacts and drops empty names', () => {
    const contacts = parseAuthorizedContacts([
      { id: 'ac-1', name: 'Jamie', phone: '555-0100', role: 'family' },
      { name: '  ', phone: '555-0101' },
      { name: 'Alex Rivera', role: 'manager', email: 'alex@club.com' },
      null,
    ]);
    assert.equal(contacts.length, 2);
    assert.equal(contacts[0].name, 'Jamie');
    assert.equal(contacts[0].role, 'family');
    assert.equal(contacts[1].name, 'Alex Rivera');
    assert.equal(contacts[1].role, 'manager');
  });
});
