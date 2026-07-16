import {
  applyNativeNotificationSoundPreference,
  ensureNativeNotificationChannel,
  getNativeNotificationSoundPreference,
  isNativeNotificationSoundAvailable,
  pickNativeSystemNotificationSound,
  previewNativeNotificationSound,
} from './guardrNotificationSoundNative';
import {
  DEFAULT_NOTIFICATION_SOUND,
  labelForNotificationSoundMode,
  loadNotificationSoundPreference,
  saveNotificationSoundPreference,
  type NotificationSoundMode,
  type NotificationSoundPreference,
} from './notificationSoundPrefs';
import { playWalkieChirpSound, primeWalkieChirpSound } from './walkieChirpSound';

export type { NotificationSoundMode, NotificationSoundPreference } from './notificationSoundPrefs';
export { DEFAULT_NOTIFICATION_SOUND, labelForNotificationSoundMode } from './notificationSoundPrefs';

export async function initNotificationSound(): Promise<void> {
  if (!isNativeNotificationSoundAvailable()) return;
  await ensureNativeNotificationChannel();
  const nativePref = await getNativeNotificationSoundPreference();
  saveNotificationSoundPreference(nativePref);
}

export async function getNotificationSoundPreference(): Promise<NotificationSoundPreference> {
  if (isNativeNotificationSoundAvailable()) {
    const nativePref = await getNativeNotificationSoundPreference();
    saveNotificationSoundPreference(nativePref);
    return nativePref;
  }
  return loadNotificationSoundPreference();
}

export async function setNotificationSoundMode(mode: NotificationSoundMode): Promise<NotificationSoundPreference> {
  if (mode === 'system_custom') {
    throw new Error('Use pickSystemNotificationSound for custom system tones');
  }

  const pref = isNativeNotificationSoundAvailable()
    ? await applyNativeNotificationSoundPreference(mode)
    : { mode, label: labelForNotificationSoundMode(mode) };

  saveNotificationSoundPreference(pref);
  if (mode === 'guardr') {
    primeWalkieChirpSound();
  }
  return pref;
}

export async function pickSystemNotificationSound(): Promise<NotificationSoundPreference> {
  const pref = await pickNativeSystemNotificationSound();
  saveNotificationSoundPreference(pref);
  return pref;
}

export async function previewNotificationSound(pref?: NotificationSoundPreference): Promise<void> {
  const current = pref ?? (await getNotificationSoundPreference());

  if (isNativeNotificationSoundAvailable()) {
    await previewNativeNotificationSound();
    return;
  }

  if (current.mode === 'guardr') {
    await playWalkieChirpSound();
  }
}

export function isSystemNotificationSoundPickerAvailable(): boolean {
  return isNativeNotificationSoundAvailable();
}
