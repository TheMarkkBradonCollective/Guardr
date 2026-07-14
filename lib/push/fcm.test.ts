import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FCM_NATIVE_ENDPOINT_PREFIX,
  fcmTokenFromEndpoint,
  isFcmConfigured,
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

  it('isFcmConfigured accepts service account JSON or legacy server key', () => {
    const originalJson = process.env.FCM_SERVICE_ACCOUNT_JSON;
    const originalKey = process.env.FCM_SERVER_KEY;
    try {
      delete process.env.FCM_SERVICE_ACCOUNT_JSON;
      delete process.env.FCM_SERVER_KEY;
      assert.equal(isFcmConfigured(), false);

      process.env.FCM_SERVER_KEY = 'legacy-key';
      assert.equal(isFcmConfigured(), true);
      delete process.env.FCM_SERVER_KEY;

      process.env.FCM_SERVICE_ACCOUNT_JSON = JSON.stringify({
        project_id: 'guardr-test',
        client_email: 'firebase-adminsdk@test.iam.gserviceaccount.com',
        private_key: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
      });
      assert.equal(isFcmConfigured(), true);
    } finally {
      if (originalJson === undefined) delete process.env.FCM_SERVICE_ACCOUNT_JSON;
      else process.env.FCM_SERVICE_ACCOUNT_JSON = originalJson;
      if (originalKey === undefined) delete process.env.FCM_SERVER_KEY;
      else process.env.FCM_SERVER_KEY = originalKey;
    }
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
