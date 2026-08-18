import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  clientAccountKindLabel,
  clientDisplayName,
  clientWorkspaceLabel,
  isClientAccountKind,
  normalizeClientAccountKind,
} from './clientAccountKind';

describe('clientAccountKind', () => {
  it('normalizes unknown values to business', () => {
    assert.equal(normalizeClientAccountKind('personal'), 'personal');
    assert.equal(normalizeClientAccountKind('business'), 'business');
    assert.equal(normalizeClientAccountKind('commercial'), 'business');
    assert.equal(normalizeClientAccountKind(undefined), 'business');
    assert.equal(isClientAccountKind('personal'), true);
    assert.equal(isClientAccountKind('company'), false);
  });

  it('labels personal and business accounts', () => {
    assert.equal(clientAccountKindLabel('personal'), 'Personal');
    assert.equal(clientAccountKindLabel('business'), 'Business');
    assert.equal(clientAccountKindLabel(undefined), 'Business');
  });

  it('uses the person name for personal accounts', () => {
    assert.equal(
      clientDisplayName({
        name: 'Alex Rivera',
        firstName: 'Alex',
        companyName: '',
        accountKind: 'personal',
      }),
      'Alex Rivera'
    );
    assert.equal(
      clientWorkspaceLabel({
        name: 'Alex Rivera',
        firstName: 'Alex',
        companyName: '',
        accountKind: 'personal',
      }),
      'Alex'
    );
  });

  it('uses the company name for business accounts', () => {
    assert.equal(
      clientDisplayName({
        name: 'Alex Rivera',
        firstName: 'Alex',
        companyName: 'Acme Sites',
        accountKind: 'business',
      }),
      'Acme Sites'
    );
    assert.equal(
      clientWorkspaceLabel({
        name: 'Alex Rivera',
        firstName: 'Alex',
        companyName: 'Acme Sites',
        accountKind: 'business',
      }),
      'Acme Sites'
    );
  });
});
