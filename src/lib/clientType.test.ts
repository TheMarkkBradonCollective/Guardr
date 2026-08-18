import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  clientDisplayName,
  clientTypeLabel,
  clientWorkspaceLabel,
  isClientType,
  normalizeClientType,
} from './clientType';

describe('clientType', () => {
  it('normalizes unknown values to business', () => {
    assert.equal(normalizeClientType('personal'), 'personal');
    assert.equal(normalizeClientType('business'), 'business');
    assert.equal(normalizeClientType('commercial'), 'business');
    assert.equal(normalizeClientType(undefined), 'business');
    assert.equal(isClientType('personal'), true);
    assert.equal(isClientType('company'), false);
  });

  it('labels personal and business accounts', () => {
    assert.equal(clientTypeLabel('personal'), 'Personal');
    assert.equal(clientTypeLabel('business'), 'Business');
    assert.equal(clientTypeLabel(undefined), 'Business');
  });

  it('uses the person name for personal contracting parties', () => {
    assert.equal(
      clientDisplayName({
        name: 'John Smith',
        firstName: 'John',
        companyName: '',
        clientType: 'personal',
      }),
      'John Smith'
    );
    assert.equal(
      clientWorkspaceLabel({
        name: 'John Smith',
        firstName: 'John',
        companyName: '',
        clientType: 'personal',
      }),
      'John'
    );
  });

  it('uses the organization name for business contracting parties', () => {
    assert.equal(
      clientDisplayName({
        name: 'Alex Rivera',
        firstName: 'Alex',
        companyName: 'ABC Nightclub',
        clientType: 'business',
      }),
      'ABC Nightclub'
    );
    assert.equal(
      clientWorkspaceLabel({
        name: 'Alex Rivera',
        firstName: 'Alex',
        companyName: 'ABC Nightclub',
        clientType: 'business',
      }),
      'ABC Nightclub'
    );
  });
});
