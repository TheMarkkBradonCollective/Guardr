import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Send } from 'lucide-react';
import type { NotificationPreferences, SessionUser } from '../../types';
import {
  getExistingSubscription,
  getPushPermission,
  isPushConfigured,
  isPushEnabledLocally,
  isPushSupported,
  setPushEnabledLocally,
  subscribeToPush,
  unsubscribeFromPush,
} from '../../lib/push';
import { sendTestPush, subscribePush, unsubscribePush } from '../../lib/pushApi';
import {
  defaultNotificationPreferences,
  loadNotificationPreferencesFromStorage,
  optionsForRole,
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
  const [enabled, setEnabled] = useState(isPushEnabledLocally());
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

  const role = roleCategory(currentUser.role);
  const typeOptions = optionsForRole(role);

  useEffect(() => {
    void isPushConfigured().then(setConfigured);
  }, []);

  useEffect(() => {
    void (async () => {
      const perm = await getPushPermission();
      setPermission(perm);
      const sub = await getExistingSubscription();
      const localOn = !!sub && isPushEnabledLocally();
      setEnabled(localOn);
      setServerSynced(localOn && perm === 'granted');
    })();
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
          const loaded = {
            userId: currentUser.id,
            assignment: data.assignment !== false,
            guardCheckin: data.guard_checkin !== false,
            missedCheckin: data.missed_checkin !== false,
            emergencyAlert: data.emergency_alert !== false,
            supportMessage: data.support_message !== false,
            jobChatMessage: data.job_chat_message !== false,
            staffMessage: data.staff_message !== false,
            updatedAt: data.updated_at ?? new Date().toISOString(),
          };
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
    if (!supported || !configured) return;
    setBusy(true);
    setMessage(null);
    try {
      if (enabled) {
        const sub = await getExistingSubscription();
        await unsubscribeFromPush();
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
          await unsubscribeFromPush();
          setPushEnabledLocally(false);
          setEnabled(false);
          setServerSynced(false);
          throw err;
        }
        setPushEnabledLocally(true);
        setEnabled(true);
        setServerSynced(true);
        setPermission('granted');
        setMessage('Push notifications enabled.');
        if (!isDbConnected) {
          await persistPrefs(defaultNotificationPreferences(currentUser.id));
        }
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Push setup failed');
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setBusy(true);
    setMessage(null);
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

  if (!supported) {
    return (
      <AppFormSection>
        <p className="uber-label">Push notifications</p>
        <p className="text-sm text-brand-text-muted mt-2">This browser does not support Web Push.</p>
      </AppFormSection>
    );
  }

  return (
    <AppFormSection className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="uber-label">Push notifications</p>
          <p className="text-xs text-brand-text-muted mt-1">
            Receive job, chat, and operational alerts when Guardr is closed.
          </p>
        </div>
        {enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5 text-brand-text-muted" />}
      </div>

      {!configured && (
        <p className="text-xs text-amber-600">
          Server VAPID keys are not configured yet. Push notifications will be available once the server is set up.
        </p>
      )}

      <div className="flex items-center justify-between gap-3 py-2 border-t border-brand-border">
        <span className="text-sm font-medium">Enable push notifications</span>
        <button
          type="button"
          disabled={busy || !configured}
          onClick={() => void handleToggle()}
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

      <p className="text-xs text-brand-text-muted">
        Browser permission: {permission}
        {permission === 'denied' ? ' — enable notifications in browser settings.' : ''}
        {permission === 'granted' && !serverSynced && enabled
          ? ' — device subscribed locally but not synced to server yet.'
          : ''}
        {permission === 'granted' && !enabled && !busy
          ? ' — turn on the toggle above to register this device.'
          : ''}
      </p>

      {message && <p className="text-xs text-brand-text-muted">{message}</p>}
    </AppFormSection>
  );
}
