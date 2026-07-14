import { isFcmConfigured } from '../../lib/push/fcm';

export function isPushConfigured(): boolean {
  const vapidReady = !!(
    process.env.VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim()
  );
  return vapidReady || isFcmConfigured();
}
