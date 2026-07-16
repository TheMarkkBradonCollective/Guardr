import {
  clientPaymentGates,
  DEFAULT_PLATFORM_SETTINGS,
  normalizePlatformSettings,
  platformAllowsSquare,
  platformAllowsStripe,
  platformPaymentModeDescription,
  platformPaymentModeLabel,
  platformSettingsFromDbRow,
  platformSmsModeLabel,
  platformBackgroundCheckModeLabel,
  platformInsuranceModeLabel,
  platformSmsModeDescription,
} from './platformSettings';
import test from 'node:test';
import assert from 'node:assert/strict';

test('platformAllowsStripe respects paymentStripeEnabled setting', () => {
  assert.equal(platformAllowsStripe({ ...DEFAULT_PLATFORM_SETTINGS, paymentStripeEnabled: true }), true);
  assert.equal(platformAllowsStripe({ ...DEFAULT_PLATFORM_SETTINGS, paymentStripeEnabled: false }), false);
});

test('platformAllowsSquare respects paymentSquareEnabled setting', () => {
  assert.equal(platformAllowsSquare({ ...DEFAULT_PLATFORM_SETTINGS, paymentSquareEnabled: true }), true);
  assert.equal(platformAllowsSquare({ ...DEFAULT_PLATFORM_SETTINGS, paymentSquareEnabled: false }), false);
});

test('normalizePlatformSettings supports stripe and square card processors', () => {
  const both = normalizePlatformSettings({
    paymentStripeEnabled: true,
    paymentSquareEnabled: true,
  });
  assert.ok(both);
  assert.equal(both!.paymentStripeEnabled, true);
  assert.equal(both!.paymentSquareEnabled, true);

  const stripeOnly = normalizePlatformSettings({
    paymentStripeEnabled: true,
    paymentSquareEnabled: false,
  });
  assert.ok(stripeOnly);
  assert.equal(stripeOnly!.paymentSquareEnabled, false);
});

test('normalizePlatformSettings requires at least one payment method', () => {
  assert.equal(
    normalizePlatformSettings({ paymentStripeEnabled: false, paymentSquareEnabled: false }),
    null
  );
});

test('platformSettingsFromDbRow reads payment_square_enabled from database', () => {
  const settings = platformSettingsFromDbRow({
    payment_stripe_enabled: true,
    payment_square_enabled: true,
  });
  assert.equal(settings.paymentSquareEnabled, true);
  assert.equal(settings.paymentStripeEnabled, true);
});

test('clientPaymentGates exposes stripe and square flags', () => {
  const gates = clientPaymentGates({
    ...DEFAULT_PLATFORM_SETTINGS,
    paymentStripeEnabled: true,
    paymentSquareEnabled: true,
  });
  assert.deepEqual(gates, { allowStripe: true, allowSquare: true });
});

test('platform payment mode labels describe stripe + square', () => {
  const settings = { ...DEFAULT_PLATFORM_SETTINGS, paymentStripeEnabled: true, paymentSquareEnabled: true };
  assert.equal(platformPaymentModeLabel(settings), 'Stripe + Square');
  assert.match(platformPaymentModeDescription(settings), /Square/i);
});

test('integration mode labels describe twilio, checkr, and insurance api toggles', () => {
  const off = { ...DEFAULT_PLATFORM_SETTINGS };
  assert.equal(platformSmsModeLabel(off), 'Off');
  assert.match(platformSmsModeDescription(off), /off/i);
  assert.equal(platformBackgroundCheckModeLabel(off), 'Manual staff review');
  assert.equal(platformInsuranceModeLabel(off), 'Manual COI review');

  const on = {
    ...DEFAULT_PLATFORM_SETTINGS,
    smsNotificationsEnabled: true,
    backgroundCheckProvider: 'checkr',
    insuranceVerificationMode: 'api',
  };
  assert.equal(platformSmsModeLabel(on), 'Twilio only');
  assert.equal(platformBackgroundCheckModeLabel(on), 'Checkr only');
  assert.equal(platformInsuranceModeLabel(on), 'Automated API');
});
