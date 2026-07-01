import {
  clientPaymentGates,
  DEFAULT_PLATFORM_SETTINGS,
  normalizePlatformSettings,
  platformAllowsCash,
  platformPaymentModeDescription,
  platformPaymentModeLabel,
  platformSettingsFromDbRow,
} from './platformSettings';
import test from 'node:test';
import assert from 'node:assert/strict';

test('platformAllowsCash respects paymentCashEnabled setting', () => {
  assert.equal(platformAllowsCash({ ...DEFAULT_PLATFORM_SETTINGS, paymentCashEnabled: true }), true);
  assert.equal(platformAllowsCash({ ...DEFAULT_PLATFORM_SETTINGS, paymentCashEnabled: false }), false);
});

test('normalizePlatformSettings keeps cash as optional secondary when stripe is on', () => {
  const both = normalizePlatformSettings({
    paymentStripeEnabled: true,
    paymentCashEnabled: true,
  });
  assert.ok(both);
  assert.equal(both!.paymentStripeEnabled, true);
  assert.equal(both!.paymentCashEnabled, true);

  const cardOnly = normalizePlatformSettings({
    paymentStripeEnabled: true,
    paymentCashEnabled: false,
  });
  assert.ok(cardOnly);
  assert.equal(cardOnly!.paymentCashEnabled, false);
});

test('normalizePlatformSettings requires at least one payment method', () => {
  assert.equal(
    normalizePlatformSettings({ paymentStripeEnabled: false, paymentCashEnabled: false }),
    null
  );
});

test('platformSettingsFromDbRow reads payment_cash_enabled from database', () => {
  const settings = platformSettingsFromDbRow({
    payment_stripe_enabled: true,
    payment_cash_enabled: true,
  });
  assert.equal(settings.paymentCashEnabled, true);
  assert.equal(settings.paymentStripeEnabled, true);
});

test('clientPaymentGates exposes card primary and cash secondary flags', () => {
  const gates = clientPaymentGates({
    ...DEFAULT_PLATFORM_SETTINGS,
    paymentStripeEnabled: true,
    paymentCashEnabled: true,
  });
  assert.deepEqual(gates, { allowStripe: true, allowCash: true });
});

test('platform payment mode labels describe card + cash', () => {
  const settings = { ...DEFAULT_PLATFORM_SETTINGS, paymentStripeEnabled: true, paymentCashEnabled: true };
  assert.equal(platformPaymentModeLabel(settings), 'Card + cash');
  assert.match(platformPaymentModeDescription(settings), /secondary/i);
});
