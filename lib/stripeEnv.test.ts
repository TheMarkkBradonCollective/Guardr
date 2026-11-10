import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isStripePaymentsConfigured,
  isStripeTestPaymentsConfigured,
  readStripeDefaultSecretKey,
  readStripeLiveSecretKey,
  readStripeTestPublishableKey,
  readStripeTestSecretKey,
  readStripeWebhookSecrets,
} from './stripeEnv.ts';

const TEST_SECRET = ['sk', 'test', 'fakeDirectorKeyForUnitTestsOnly'].join('_');
const LIVE_SECRET = ['sk', 'live', 'fakeLiveKeyForUnitTestsOnly'].join('_');
const TEST_PK = ['pk', 'test', 'fakeDirectorPkForUnitTestsOnly'].join('_');
const LIVE_PK = ['pk', 'live', 'fakeLivePkForUnitTestsOnly'].join('_');
const TEST_WHSEC = ['whsec', 'fakeTestSigningSecret'].join('_');
const LIVE_WHSEC = ['whsec', 'fakeLiveSigningSecret'].join('_');

describe('stripe env test vs live keys', () => {
  it('treats an existing sk_test STRIPE_SECRET_KEY as the permanent test secret', () => {
    const env = { STRIPE_SECRET_KEY: TEST_SECRET, STRIPE_WEBHOOK_SECRET: TEST_WHSEC };
    assert.equal(readStripeTestSecretKey(env), TEST_SECRET);
    assert.equal(readStripeLiveSecretKey(env), undefined);
    assert.equal(readStripeDefaultSecretKey(env), TEST_SECRET);
    assert.equal(isStripePaymentsConfigured(env), true);
    assert.equal(isStripeTestPaymentsConfigured(env), true);
    assert.deepEqual(readStripeWebhookSecrets(env), [TEST_WHSEC]);
  });

  it('keeps the test secret after a live key is configured', () => {
    const env = {
      STRIPE_SECRET_KEY: LIVE_SECRET,
      STRIPE_TEST_SECRET_KEY: TEST_SECRET,
      STRIPE_PUBLISHABLE_KEY: LIVE_PK,
      STRIPE_TEST_PUBLISHABLE_KEY: TEST_PK,
      STRIPE_WEBHOOK_SECRET: LIVE_WHSEC,
      STRIPE_TEST_WEBHOOK_SECRET: TEST_WHSEC,
    };
    assert.equal(readStripeLiveSecretKey(env), LIVE_SECRET);
    assert.equal(readStripeTestSecretKey(env), TEST_SECRET);
    assert.equal(readStripeDefaultSecretKey(env), LIVE_SECRET);
    assert.equal(readStripeTestPublishableKey(env), TEST_PK);
    assert.deepEqual(readStripeWebhookSecrets(env), [LIVE_WHSEC, TEST_WHSEC]);
  });

  it('never treats a live secret as a test key', () => {
    const env = { STRIPE_SECRET_KEY: LIVE_SECRET, STRIPE_TEST_SECRET_KEY: LIVE_SECRET };
    assert.equal(readStripeTestSecretKey(env), undefined);
    assert.equal(readStripeLiveSecretKey(env), LIVE_SECRET);
    assert.equal(isStripeTestPaymentsConfigured(env), false);
  });
});
