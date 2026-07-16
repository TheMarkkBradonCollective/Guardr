export type NotificationSoundMode = 'guardr' | 'system_default' | 'system_custom';

export interface NotificationSoundPreference {
  mode: NotificationSoundMode;
  uri?: string;
  label: string;
}

const STORAGE_KEY = 'guardr_notification_sound_pref';

export const DEFAULT_NOTIFICATION_SOUND: NotificationSoundPreference = {
  mode: 'guardr',
  label: 'Guardr tone',
};

export function isNotificationSoundMode(value: unknown): value is NotificationSoundMode {
  return value === 'guardr' || value === 'system_default' || value === 'system_custom';
}

export function labelForNotificationSoundMode(mode: NotificationSoundMode): string {
  if (mode === 'guardr') return 'Guardr tone';
  if (mode === 'system_default') return 'System default';
  return 'Custom tone';
}

export function loadNotificationSoundPreference(): NotificationSoundPreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_SOUND;
    const parsed = JSON.parse(raw) as Partial<NotificationSoundPreference>;
    if (!isNotificationSoundMode(parsed.mode)) return DEFAULT_NOTIFICATION_SOUND;
    return {
      mode: parsed.mode,
      uri: typeof parsed.uri === 'string' ? parsed.uri : undefined,
      label:
        typeof parsed.label === 'string' && parsed.label.trim()
          ? parsed.label
          : labelForNotificationSoundMode(parsed.mode),
    };
  } catch {
    return DEFAULT_NOTIFICATION_SOUND;
  }
}

export function saveNotificationSoundPreference(pref: NotificationSoundPreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
  } catch {
    /* ignore */
  }
}
