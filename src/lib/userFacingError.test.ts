import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isOfflineError, userFacingError } from './userFacingError.ts';

describe('userFacingError', () => {
  it('maps network failures to a reconnect message', () => {
    assert.match(userFacingError(new TypeError('Failed to fetch')), /connection/i);
    assert.equal(isOfflineError(new TypeError('Failed to fetch')), true);
  });

  it('hides raw backend / SQL errors', () => {
    assert.equal(
      userFacingError('column app_channel of relation push_subscriptions does not exist'),
      'Something went wrong. Please try again.',
    );
    assert.match(userFacingError('internal server error 500'), /temporarily unavailable/i);
  });

  it('keeps short, already-friendly messages', () => {
    assert.equal(userFacingError('Choose a stronger password.'), 'Choose a stronger password.');
  });

  it('maps authorization failures without leaking JWT details', () => {
    assert.match(userFacingError('JWT expired'), /session expired/i);
    assert.match(userFacingError('Forbidden'), /permission/i);
  });
});
