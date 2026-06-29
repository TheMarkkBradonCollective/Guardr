import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptGuardPriceOffer,
  appendGuardPriceOffer,
  createPriceOffer,
  getActivePriceOffer,
} from './agreementPricing';
import { DEFAULT_PLATFORM_FEE_CONFIG } from './platformFees';

test('appendGuardPriceOffer supersedes prior pending offers', () => {
  const first = createPriceOffer({
    offeredBy: 'guard',
    offeredByUserId: 'guard-1',
    hourlyRate: 35,
  });
  const second = createPriceOffer({
    offeredBy: 'client',
    offeredByUserId: 'client-1',
    hourlyRate: 40,
  });
  const negotiations = appendGuardPriceOffer(
    appendGuardPriceOffer(undefined, 'guard-1', first),
    'guard-1',
    second
  );
  const thread = negotiations.find((n) => n.guardId === 'guard-1');
  assert.equal(thread?.offers.length, 2);
  assert.equal(thread?.offers[0].status, 'superseded');
  assert.equal(getActivePriceOffer(thread)?.hourlyRate, 40);
});

test('acceptGuardPriceOffer locks agreed billing inputs', () => {
  const offer = createPriceOffer({
    offeredBy: 'guard',
    offeredByUserId: 'guard-1',
    hourlyRate: 42,
    agreementFeeConfig: { model: 'flat', flatFeePerHour: 6 },
  });
  const negotiations = appendGuardPriceOffer(undefined, 'guard-1', offer);
  const { negotiations: agreed, offer: accepted } = acceptGuardPriceOffer(
    negotiations,
    'guard-1',
    offer.id
  );
  assert.ok(accepted);
  assert.equal(agreed[0]?.status, 'agreed');
  assert.equal(accepted?.hourlyRate, 42);
  assert.equal(accepted?.agreementFeeConfig?.flatFeePerHour, 6);
  assert.equal(DEFAULT_PLATFORM_FEE_CONFIG.model, 'flat');
});
