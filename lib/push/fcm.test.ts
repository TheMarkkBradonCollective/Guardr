import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FCM_NATIVE_ENDPOINT_PREFIX,
  fcmTokenFromEndpoint,
  isFcmNativeEndpoint,
  isFcmNativeSubscription,
  isValidPushSubscriptionPayload,
} from './fcm.ts';

describe('fcm native push', () => {
  it('detects fcm-native endpoints', () => {
    const endpoint = `${FCM_NATIVE_ENDPOINT_PREFIX}abc123`;
    assert.equal(isFcmNativeEndpoint(endpoint), true);
    assert.equal(fcmTokenFromEndpoint(endpoint), 'abc123');
  });

  it('accepts native subscription payloads', () => {
    const subscription = {
      endpoint: `${FCM_NATIVE_ENDPOINT_PREFIX}device-token`,
      keys: { p256dh: 'native-fcm', auth: 'native-fcm' },
    };
    assert.equal(isFcmNativeSubscription(subscription), true);
    assert.equal(isValidPushSubscriptionPayload(subscription), true);
  });

  it('still requires web push keys for standard endpoints', () => {
    assert.equal(
      isValidPushSubscriptionPayload({
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
        keys: { p256dh: 'native-fcm', auth: 'native-fcm' },
      }),
      false
    );
    assert.equal(
      isValidPushSubscriptionPayload({
        endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/abc',
        keys: { p256dh: 'key', auth: 'secret' },
      }),
      true
    );
  });
});
