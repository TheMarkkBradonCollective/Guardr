import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Music2, Send } from 'lucide-react';
import type { NotificationPreferences, SessionUser } from '../../types';
import {
  getExistingPushSubscription,
  getPushPermission,
  isNativeFcmConfigured,
  isNativePushPlatform,
  isPushConfigured,
  isPushEnabledLocally,
  isPushSupported,
  NATIVE_FCM_NOT_CONFIGURED_MESSAGE,
  resolveNativePushToggleState,
  setPushEnabledLocally,
  subscribeToPush,
  unsubscribeFromPush,
} from '../../lib/push';
import { primeWalkieChirpSound } from '../../lib/walkieChirpSound';
import {
  getNotificationSoundPreference,
  isSystemNotificationSoundPickerAvailable,
  labelForNotificationSoundMode,
  pickSystemNotificationSound,
  previewNotificationSound,
  setNotificationSoundMode,
  type NotificationSoundMode,
  type NotificationSoundPreference,
} from '../../lib/notificationSound';
import { sendTestPush, subscribePush, unsubscribePush } from '../../lib/pushApi';
import {
  defaultNotificationPreferences,
  loadNotificationPreferencesFromStorage,
  optionsForRole,
  prefsFromDbRow,
  prefsToDbRow,
  roleCategory,
  saveNotificationPreferencesToStorage,
} from '../../lib/notificationPreferences';
import { supabase } from '../../lib/supabase';
import { AppFormSection } from '../ui/app/AppPrimitives';

interface PushNotificationsPanelProps {
  currentUser: SessionUser;
  isDbConnected?: boolean;
}

export function PushNotificationsPanel({ currentUser, isDbConnected = false }: PushNotificationsPanelProps) {
  const supported = isPushSupported();
  const [configured, setConfigured] = useState(
    !!((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_VAPID_PUBLIC_KEY ?? '').trim()
  );
  const [enabled, setEnabled] = useState(false);
  const [stateReady, setStateReady] = useState(false);
  const [serverSynced, setServerSynced] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [useQuietHours, setUseQuietHours] = useState(false);
  const [siteId, setSiteId] = useState('');
  const [prefs, setPrefs] = useState<NotificationPreferences>(() =>
    loadNotificationPreferencesFromStorage(currentUser.id)
  );
  const [soundPref, setSoundPref] = useState<NotificationSoundPreference | null>(null);
  const [soundBusy, setSoundBusy] = useState(false);

  const role = roleCategory(currentUser.role);
  const typeOptions = optionsForRole(role);

  useEffect(() => {
    void isPushConfigured().then(setConfigured);
  }, []);

  const refreshPushState = async () => {
    if (isNativePushPlatform()) {
      const state = await resolveNativePushToggleState();
      setPermission(state.permission);
      setEnabled(state.enabled);
      setServerSynced(state.enabled && state.permission === 'granted');
      setStateReady(true);
      return;
    }

    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.ready;
      } catch {
        /* ignore */
      }
    }

    const perm = await getPushPermission();
    const sub = await getExistingPushSubscription();
    const active = perm === 'granted' && !!sub;
    if (active && !isPushEnabledLocally()) {
      setPushEnabledLocally(true);
    }
    if (!active && isPushEnabledLocally()) {
      setPushEnabledLocally(false);
    }
    setPermission(perm);
    setEnabled(active);
    setServerSynced(active);
    setStateReady(true);
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const pref = await getNotificationSoundPreference();
      if (!cancelled) setSoundPref(pref);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await refreshPushState();
      if (cancelled) return;
    })();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshPushState();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => {
    if (!isDbConnected) return;
    void (async () => {
      try {
        const { data } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        if (data) {
          const loaded = prefsFromDbRow(data as Record<string, unknown>);
          setPrefs(loaded);
          saveNotificationPreferencesToStorage(loaded);
        }
      } catch {
        /* table may not exist yet */
      }
    })();
  }, [currentUser.id, isDbConnected]);

  const persistPrefs = async (next: NotificationPreferences) => {
    setPrefs(next);
    saveNotificationPreferencesToStorage(next);
    if (!isDbConnected) return;
    try {
      await supabase.from('notification_preferences').upsert(prefsToDbRow(next));
    } catch {
      /* ignore */
    }
  };

  const handleTogglePref = async (key: keyof Omit<NotificationPreferences, 'userId' | 'updatedAt'>) => {
    const next = { ...prefs, [key]: !prefs[key], updatedAt: new Date().toISOString() };
    await persistPrefs(next);
  };

  const handleToggle = async () => {
    if (!supported || !configured || busy) return;
    if (isNativePushPlatform() && !isNativeFcmConfigured()) {
      setMessage(NATIVE_FCM_NOT_CONFIGURED_MESSAGE);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      if (enabled) {
        const sub = await getExistingPushSubscription();
        try {
          await unsubscribeFromPush();
        } catch (err) {
          console.warn('[push] native unsubscribe failed:', err);
        }
        try {
          await unsubscribePush(currentUser, sub?.endpoint);
        } catch {
          /* local unsubscribe still counts */
        }
        setPushEnabledLocally(false);
        setEnabled(false);
        setServerSynced(false);
        setMessage('Push notifications disabled.');
      } else {
        const subscription = await subscribeToPush();
        if (!subscription) throw new Error('Could not create subscription');
        try {
          await subscribePush(currentUser, subscription, {
            siteId: siteId.trim() || undefined,
            quietHoursStart: useQuietHours ? quietStart : undefined,
            quietHoursEnd: useQuietHours ? quietEnd : undefined,
          });
        } catch (err) {
          try {
            await unsubscribeFromPush();
          } catch {
            /* ignore */
          }
          setPushEnabledLocally(false);
          setEnabled(false);
          setServerSynced(false);
          const msg = err instanceof Error ? err.message : 'Could not sync with server';
          setMessage(msg);
          return;
        }
        setPushEnabledLocally(true);
        setEnabled(true);
        setServerSynced(true);
        const perm = await getPushPermission();
        setPermission(perm);
        setMessage('Push notifications enabled.');
        primeWalkieChirpSound();
        if (!isDbConnected) {
          await persistPrefs(defaultNotificationPreferences(currentUser.id));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Push setup failed';
      setMessage(msg);
      await refreshPushState();
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setBusy(true);
    setMessage(null);
    primeWalkieChirpSound();
    try {
      const result = await sendTestPush(currentUser, siteId.trim() || undefined);
      if (result.sent === 0) {
        setMessage('Test queued, but no active device subscription was found.');
      } else {
        setMessage('Test notification sent.');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Test notification failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSoundModeChange = async (mode: NotificationSoundMode) => {
    if (soundBusy) return;
    setSoundBusy(true);
    setMessage(null);
    try {
      const next = await setNotificationSoundMode(mode);
      setSoundPref(next);
      setMessage(`Notification sound set to ${next.label}.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not update notification sound');
    } finally {
      setSoundBusy(false);
    }
  };

  const handlePickSystemSound = async () => {
    if (soundBusy) return;
    setSoundBusy(true);
    setMessage(null);
    try {
      const next = await pickSystemNotificationSound();
      setSoundPref(next);
      setMessage(`Notification sound set to ${next.label}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not pick notification sound';
      if (!msg.toLowerCase().includes('cancel')) {
        setMessage(msg);
      }
    } finally {
      setSoundBusy(false);
    }
  };

  const handlePreviewSound = async () => {
    if (soundBusy) return;
    setSoundBusy(true);
    try {
      await previewNotificationSound(soundPref ?? undefined);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not preview notification sound');
    } finally {
      setSoundBusy(false);
    }
  };

  const soundOptions: Array<{ mode: NotificationSoundMode; label: string; description: string }> = [
    {
      mode: 'guardr',
      label: 'Guardr tone',
      description: 'Motorola-style walkie-talkie chirp',
    },
    {
      mode: 'system_default',
      label: 'System default',
      description: 'Your device default notification sound',
    },
  ];

  if (!supported) {
    return (
      <AppFormSection>
        <p className="uber-label">Push notifications</p>
        <p className="text-sm text-brand-text-muted mt-2">
          Push notifications are not available in this environment.
        </p>
      </AppFormSection>
    );
  }

  const nativeApp = isNativePushPlatform();
  const nativeFcmReady = !nativeApp || isNativeFcmConfigured();
  const canTogglePush = configured && nativeFcmReady && !busy && stateReady;
  const osNotificationsAllowed = permission === 'granted';

  return (
    <AppFormSection className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="uber-label">Push notifications</p>
        </div>
        {enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5 text-brand-text-muted" />}
      </div>

      {!configured && !nativeApp && (
        <p className="text-xs text-amber-600">
          Server VAPID keys are not configured yet. Push notifications will be available once the server is set up.
        </p>
      )}

      {nativeApp && !nativeFcmReady && (
        <p className="text-xs text-amber-600 leading-relaxed">
          {NATIVE_FCM_NOT_CONFIGURED_MESSAGE}
        </p>
      )}

      {nativeApp && nativeFcmReady && (
        <p className="text-xs text-brand-text-muted leading-relaxed">
          Guardr app notifications use Firebase Cloud Messaging. Android may already allow alerts — use the toggle
          below to register this device with Guardr.
        </p>
      )}

      <div className="flex items-center justify-between gap-3 py-2 border-t border-brand-border">
        <span className="text-sm font-medium">Register this device</span>
        <button
          type="button"
          disabled={!canTogglePush}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void handleToggle();
          }}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
            enabled ? 'bg-brand-primary' : 'bg-brand-border'
          }`}
          aria-pressed={enabled}
          aria-label={enabled ? 'Disable push notifications' : 'Enable push notifications'}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="space-y-3 border-t border-brand-border pt-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="uber-label">Notification sound</p>
            <p className="text-xs text-brand-text-muted mt-1">
              {soundPref?.label ?? labelForNotificationSoundMode('guardr')}
            </p>
          </div>
          <button
            type="button"
            disabled={soundBusy}
            onClick={() => void handlePreviewSound()}
            className="flex items-center gap-1.5 text-xs app-button-outline !h-9 !px-3 disabled:opacity-50"
          >
            <Music2 className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>

        <div className="space-y-2">
          {soundOptions.map((opt) => {
            const selected = (soundPref?.mode ?? 'guardr') === opt.mode;
            return (
              <label
                key={opt.mode}
                className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                  selected ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-border'
                }`}
              >
                <input
                  type="radio"
                  name="notification-sound"
                  checked={selected}
                  disabled={soundBusy}
                  onChange={() => void handleSoundModeChange(opt.mode)}
                  className="mt-1"
                />
                <span className="min-w-0">
                  <span className="text-sm font-medium block">{opt.label}</span>
                  <span className="text-xs text-brand-text-muted">{opt.description}</span>
                </span>
              </label>
            );
          })}

          {isSystemNotificationSoundPickerAvailable() && (
            <label
              className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                soundPref?.mode === 'system_custom'
                  ? 'border-brand-primary bg-brand-primary/5'
                  : 'border-brand-border'
              }`}
            >
              <input
                type="radio"
                name="notification-sound"
                checked={soundPref?.mode === 'system_custom'}
                disabled={soundBusy}
                onChange={() => void handlePickSystemSound()}
                className="mt-1"
              />
              <span className="min-w-0">
                <span className="text-sm font-medium block">Choose system tone</span>
                <span className="text-xs text-brand-text-muted">
                  Pick any notification sound installed on this device
                  {soundPref?.mode === 'system_custom' && soundPref.label ? ` — ${soundPref.label}` : ''}
                </span>
              </span>
            </label>
          )}
        </div>

        {nativeApp && (
          <p className="text-xs text-brand-text-muted leading-relaxed">
            Android uses a notification channel for alert sounds. Changing the tone updates the Guardr alerts channel on
            this device.
          </p>
        )}
      </div>

      {enabled && typeOptions.length > 0 && (
        <div className="space-y-3 border-t border-brand-border pt-3">
          <p className="uber-label">Alert types</p>
          {typeOptions.map((opt) => (
            <label key={opt.key} className="flex items-start justify-between gap-3 py-1">
              <span className="min-w-0">
                <span className="text-sm font-medium block">{opt.label}</span>
                <span className="text-xs text-brand-text-muted">{opt.description}</span>
              </span>
              <button
                type="button"
                onClick={() => void handleTogglePref(opt.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors mt-0.5 ${
                  prefs[opt.key] ? 'bg-brand-primary' : 'bg-brand-border'
                }`}
                aria-pressed={prefs[opt.key]}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    prefs[opt.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      )}

      {currentUser.role === 'guard' && (
        <div className="space-y-3 border-t border-brand-border pt-3">
          <label className="block">
            <span className="uber-label">Site / location tag (optional)</span>
            <input
              type="text"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              placeholder="e.g. west-gate"
              className="uber-input w-full mt-1"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useQuietHours}
              onChange={(e) => setUseQuietHours(e.target.checked)}
            />
            Quiet hours (skip non-emergency alerts)
          </label>

          {useQuietHours && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="uber-label">Start</span>
                <input type="time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} className="uber-input w-full mt-1" />
              </label>
              <label className="block text-sm">
                <span className="uber-label">End</span>
                <input type="time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} className="uber-input w-full mt-1" />
              </label>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={busy || !enabled}
        onClick={() => void handleTest()}
        className="w-full flex items-center justify-center gap-2 app-button-outline !h-11 !text-sm disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        Test notification
      </button>

      <p className="text-xs text-brand-text-muted leading-relaxed">
        {nativeApp ? (
          <>
            Android notifications: {osNotificationsAllowed ? 'Allowed' : permission}
            {' · '}
            Guardr device registration: {enabled ? 'On' : 'Off'}
            {!nativeFcmReady
              ? ' — install a push-enabled APK (built with google-services.json).'
              : permission === 'denied'
                ? ' — enable notifications for Guardr in Android settings.'
                : !enabled && !busy && !message
                  ? ' — turn on the toggle above to register this device.'
                  : ''}
          </>
        ) : (
          <>
            Browser permission: {permission}
            {permission === 'denied' ? ' — enable notifications in browser settings.' : ''}
            {permission === 'granted' && !serverSynced && enabled
              ? ' — device subscribed locally but not synced to server yet.'
              : ''}
            {permission === 'granted' && !enabled && !busy && !message
              ? ' — turn on the toggle above to register this device.'
              : ''}
          </>
        )}
      </p>

      {message && (
        <p
          className={`text-xs ${
            message.includes('unavailable') ||
            message.includes('failed') ||
            message.includes('not configured') ||
            message.includes('google-services') ||
            message.includes('Firebase') ||
            message.includes('Unauthorized') ||
            message.includes('missing')
              ? 'text-amber-600'
              : 'text-brand-text-muted'
          }`}
        >
          {message}
        </p>
      )}
    </AppFormSection>
  );
}
