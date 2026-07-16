import { Capacitor, registerPlugin } from '@capacitor/core';
import type { NotificationSoundMode, NotificationSoundPreference } from './notificationSoundPrefs';
import { DEFAULT_NOTIFICATION_SOUND, labelForNotificationSoundMode } from './notificationSoundPrefs';

export interface GuardrNotificationSoundPlugin {
  applyPreference(options: { mode: NotificationSoundMode; uri?: string }): Promise<NotificationSoundPreference>;
  getPreference(): Promise<NotificationSoundPreference>;
  pickSystemSound(): Promise<NotificationSoundPreference>;
  previewSound(): Promise<void>;
  ensureChannel(): Promise<void>;
}

const GuardrNotificationSound = registerPlugin<GuardrNotificationSoundPlugin>('GuardrNotificationSound');

function normalizePreference(raw: Partial<NotificationSoundPreference> | null | undefined): NotificationSoundPreference {
  if (!raw?.mode) return DEFAULT_NOTIFICATION_SOUND;
  return {
    mode: raw.mode,
    uri: raw.uri,
    label: raw.label?.trim() || labelForNotificationSoundMode(raw.mode),
  };
}

export function isNativeNotificationSoundAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function ensureNativeNotificationChannel(): Promise<void> {
  if (!isNativeNotificationSoundAvailable()) return;
  try {
    await GuardrNotificationSound.ensureChannel();
  } catch (err) {
    console.warn('[notification-sound] ensureChannel failed:', err);
  }
}

export async function getNativeNotificationSoundPreference(): Promise<NotificationSoundPreference> {
  if (!isNativeNotificationSoundAvailable()) return DEFAULT_NOTIFICATION_SOUND;
  try {
    const pref = await GuardrNotificationSound.getPreference();
    return normalizePreference(pref);
  } catch (err) {
    console.warn('[notification-sound] getPreference failed:', err);
    return DEFAULT_NOTIFICATION_SOUND;
  }
}

export async function applyNativeNotificationSoundPreference(
  mode: NotificationSoundMode,
  uri?: string
): Promise<NotificationSoundPreference> {
  if (!isNativeNotificationSoundAvailable()) {
    return { mode, uri, label: labelForNotificationSoundMode(mode) };
  }
  const pref = await GuardrNotificationSound.applyPreference({ mode, uri });
  return normalizePreference(pref);
}

export async function pickNativeSystemNotificationSound(): Promise<NotificationSoundPreference> {
  if (!isNativeNotificationSoundAvailable()) {
    throw new Error('System notification sounds are only available in the Guardr Android app');
  }
  const pref = await GuardrNotificationSound.pickSystemSound();
  return normalizePreference(pref);
}

export async function previewNativeNotificationSound(): Promise<void> {
  if (!isNativeNotificationSoundAvailable()) return;
  await GuardrNotificationSound.previewSound();
}
