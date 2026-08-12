import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { openMarketplaceJobIsGuardVisible } from './guardJobs.ts';

describe('openMarketplaceJobIsGuardVisible', () => {
  it('hides unpaid marketplace jobs from guard browse', () => {
    assert.equal(
      openMarketplaceJobIsGuardVisible({ paymentStatus: 'unpaid', requestType: 'marketplace' }),
      false
    );
  });

  it('shows paid marketplace jobs on guard browse', () => {
    assert.equal(
      openMarketplaceJobIsGuardVisible({ paymentStatus: 'paid', requestType: 'marketplace' }),
      true
    );
  });

  it('allows direct requests before payment', () => {
    assert.equal(
      openMarketplaceJobIsGuardVisible({ paymentStatus: 'unpaid', requestType: 'direct' }),
      true
    );
  });

  it('uses GuardJobView clientPaymentRecorded when paymentStatus is omitted', () => {
    assert.equal(
      openMarketplaceJobIsGuardVisible({ requestType: 'marketplace', clientPaymentRecorded: true }),
      true
    );
    assert.equal(
      openMarketplaceJobIsGuardVisible({ requestType: 'marketplace', clientPaymentRecorded: false }),
      false
    );
  });
});
