import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Send } from 'lucide-react';
import type { SessionUser } from '../../types';
import {
  getExistingSubscription,
  getPushPermission,
  getVapidPublicKey,
  isPushEnabledLocally,
  isPushSupported,
  setPushEnabledLocally,
  subscribeToPush,
  unsubscribeFromPush,
} from '../../lib/push';
import { sendTestPush, subscribePush, unsubscribePush } from '../../lib/pushApi';
import { AppFormSection } from '../ui/app/AppPrimitives';

interface PushNotificationsPanelProps {
  currentUser: SessionUser;
}

export function PushNotificationsPanel({ currentUser }: PushNotificationsPanelProps) {
  const supported = isPushSupported();
  const configured = !!getVapidPublicKey();
  const [enabled, setEnabled] = useState(isPushEnabledLocally());
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [useQuietHours, setUseQuietHours] = useState(false);
  const [siteId, setSiteId] = useState('');

  useEffect(() => {
    void (async () => {
      setPermission(await getPushPermission());
      const sub = await getExistingSubscription();
      setEnabled(!!sub && isPushEnabledLocally());
    })();
  }, []);

  const handleToggle = async () => {
    if (!supported || !configured) return;
    setBusy(true);
    setMessage(null);
    try {
      if (enabled) {
        const sub = await getExistingSubscription();
        await unsubscribeFromPush();
        await unsubscribePush(currentUser, sub?.endpoint);
        setPushEnabledLocally(false);
        setEnabled(false);
        setMessage('Push notifications disabled.');
      } else {
        const subscription = await subscribeToPush();
        if (!subscription) throw new Error('Could not create subscription');
        await subscribePush(currentUser, subscription, {
          siteId: siteId.trim() || undefined,
          quietHoursStart: useQuietHours ? quietStart : undefined,
          quietHoursEnd: useQuietHours ? quietEnd : undefined,
        });
        setPushEnabledLocally(true);
        setEnabled(true);
        setPermission('granted');
        setMessage('Push notifications enabled.');
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
            Receive dispatch alerts and assignment updates when Guardr is closed.
          </p>
        </div>
        {enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5 text-brand-text-muted" />}
      </div>

      {!configured && (
        <p className="text-xs text-amber-600">
          Server VAPID keys are not configured yet. Add VITE_VAPID_PUBLIC_KEY to enable subscriptions.
        </p>
      )}

      <div className="flex items-center justify-between gap-3 py-2 border-t border-brand-border">
        <span className="text-sm font-medium">Enable push notifications</span>
        <button
          type="button"
          disabled={busy || !configured}
          onClick={() => void handleToggle()}
          className={`relative w-12 h-7 rounded-full transition-colors ${enabled ? 'bg-brand-primary' : 'bg-brand-border'} disabled:opacity-50`}
          aria-pressed={enabled}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : ''}`}
          />
        </button>
      </div>

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
        Permission: {permission}
        {permission === 'denied' ? ' — enable notifications in browser settings.' : ''}
      </p>

      {message && <p className="text-xs text-brand-text-muted">{message}</p>}
    </AppFormSection>
  );
}
