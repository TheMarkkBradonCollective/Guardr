import React, { useEffect, useState } from 'react';
import { SessionUser } from '../../types';
import {
  PlatformSettings,
  platformPaymentModeDescription,
  platformPaymentModeLabel,
} from '../../lib/platformSettings';
import { canManagePlatformSettings } from '../../lib/permissions';
import { fetchPaymentProcessorHealth } from '../../lib/paymentProcessorApi';
import type { CardPaymentProcessor, PaymentProcessorHealth } from '../../lib/paymentProcessors';
import { CARD_PROCESSOR_LABELS, processorEnvHint } from '../../lib/paymentProcessors';
import { AppFormSection } from '../ui/app/AppPrimitives';
import { AppSwitch } from '../ui/AppSwitch';
import { useDevice } from '../../lib/platform';
import { showAppToast } from '../ui/AppToast';
import { StaffOpsPageShell } from './StaffOpsPageShell';

interface StaffIntegrationsPanelProps {
  currentUser: SessionUser;
  platformSettings: PlatformSettings;
  onUpdatePlatformSettings?: (settings: PlatformSettings) => void | Promise<void>;
}

function DesktopSettingsCard({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`adm-card adm-platform-settings-card ${className}`.trim()}>
      <h3 className="adm-card-title adm-platform-settings-card-title">{title}</h3>
      {children}
    </section>
  );
}

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        connected
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
      }`}
    >
      {connected ? 'Connected' : 'Not connected'}
    </span>
  );
}

export function StaffIntegrationsPanel({
  currentUser,
  platformSettings,
  onUpdatePlatformSettings,
}: StaffIntegrationsPanelProps) {
  const { formFactor } = useDevice();
  const canEdit = canManagePlatformSettings(currentUser);
  const isDesktop = formFactor === 'desktop';
  const [stripeEnabled, setStripeEnabled] = useState(platformSettings.paymentStripeEnabled);
  const [squareEnabled, setSquareEnabled] = useState(platformSettings.paymentSquareEnabled);
  const [savingModes, setSavingModes] = useState(false);
  const [processorHealth, setProcessorHealth] = useState<PaymentProcessorHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    setStripeEnabled(platformSettings.paymentStripeEnabled);
    setSquareEnabled(platformSettings.paymentSquareEnabled);
  }, [platformSettings.paymentStripeEnabled, platformSettings.paymentSquareEnabled]);

  useEffect(() => {
    let cancelled = false;
    setHealthLoading(true);
    void fetchPaymentProcessorHealth()
      .then((health) => {
        if (!cancelled) setProcessorHealth(health);
      })
      .catch(() => {
        if (!cancelled) {
          setProcessorHealth({
            stripe: { configured: false },
            square: { configured: false },
          });
        }
      })
      .finally(() => {
        if (!cancelled) setHealthLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persistSettings = async (patch: Partial<PlatformSettings>) => {
    if (!onUpdatePlatformSettings || !canEdit) return;
    await onUpdatePlatformSettings({
      ...platformSettings,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  };

  const isProcessorConnected = (processor: CardPaymentProcessor): boolean => {
    if (!processorHealth) return false;
    return processor === 'stripe'
      ? processorHealth.stripe.configured
      : processorHealth.square.configured;
  };

  const persistPaymentModes = async (nextStripe: boolean, nextSquare: boolean) => {
    if (!onUpdatePlatformSettings) return;
    if (!nextStripe && !nextSquare) {
      showAppToast('Enable at least one payment method.', { tone: 'error' });
      return;
    }
    setSavingModes(true);
    try {
      await onUpdatePlatformSettings({
        ...platformSettings,
        paymentStripeEnabled: nextStripe,
        paymentSquareEnabled: nextSquare,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setSavingModes(false);
    }
  };

  const toggleProcessor = async (processor: CardPaymentProcessor) => {
    if (!canEdit || savingModes) return;
    const connected = isProcessorConnected(processor);
    const isStripe = processor === 'stripe';
    const currentlyEnabled = isStripe ? stripeEnabled : squareEnabled;
    const next = !currentlyEnabled;

    if (next && !connected) {
      showAppToast(`${CARD_PROCESSOR_LABELS[processor]} is not connected. ${processorEnvHint(processor)}`, {
        tone: 'error',
      });
      return;
    }

    if (isStripe) {
      setStripeEnabled(next);
      await persistPaymentModes(next, squareEnabled);
    } else {
      setSquareEnabled(next);
      await persistPaymentModes(stripeEnabled, next);
    }
  };

  const renderProcessorToggle = (processor: CardPaymentProcessor, primary = false) => {
    const isStripe = processor === 'stripe';
    const enabled = isStripe ? stripeEnabled : squareEnabled;
    const connected = isProcessorConnected(processor);
    const canToggleOn = connected || enabled;

    return (
      <label
        key={processor}
        className={`flex items-start gap-3 rounded-xl border p-4 ${
          primary ? 'border-brand-primary/30 bg-brand-primary/5' : 'border-brand-border'
        } ${canEdit && canToggleOn ? 'cursor-pointer' : 'opacity-90'}`}
      >
        <input
          type="checkbox"
          className="mt-1"
          checked={enabled}
          onChange={() => void toggleProcessor(processor)}
          disabled={!canEdit || savingModes || (!canToggleOn && !enabled)}
        />
        <span className="flex-1 min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">Card ({CARD_PROCESSOR_LABELS[processor]})</span>
            {!healthLoading && <ConnectionBadge connected={connected} />}
          </span>
          <span className="text-xs text-brand-text-muted block mt-1">
            {primary
              ? 'Primary card processor — Stripe Checkout + Connect guard payouts'
              : 'Alternative card processor — Square checkout for client payments'}
          </span>
          {!connected && !enabled && (
            <span className="text-xs text-amber-400/90 block mt-1.5">
              Connect {CARD_PROCESSOR_LABELS[processor]} in env before enabling.
            </span>
          )}
          {enabled && !connected && (
            <span className="text-xs text-amber-400/90 block mt-1.5">
              Enabled but not connected — clients cannot pay until env is configured.
            </span>
          )}
        </span>
      </label>
    );
  };

  const paymentMethodsBody = (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
        Current mode: {platformPaymentModeLabel(platformSettings)}
      </p>
      <p className="text-sm text-brand-text-muted leading-relaxed">
        {platformPaymentModeDescription(platformSettings)}
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {renderProcessorToggle('stripe', true)}
        {renderProcessorToggle('square')}
      </div>
      {!canEdit && (
        <p className="text-xs text-brand-text-muted">Only the Founder can change payment methods.</p>
      )}
    </div>
  );

  const integrationsBody = (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>SMS notifications (Twilio — configure in env)</span>
        <AppSwitch
          checked={platformSettings.smsNotificationsEnabled === true}
          disabled={!canEdit}
          onChange={(checked) => void persistSettings({ smsNotificationsEnabled: checked })}
          ariaLabel="SMS notifications"
        />
      </div>
      <label className="uber-label block">Background check provider</label>
      <select
        className="uber-input w-full"
        value={platformSettings.backgroundCheckProvider ?? 'manual'}
        disabled={!canEdit}
        onChange={(e) => void persistSettings({ backgroundCheckProvider: e.target.value })}
      >
        <option value="manual">Manual staff review</option>
        <option value="checkr">Checkr (API key required)</option>
      </select>
      <label className="uber-label block">Insurance verification</label>
      <select
        className="uber-input w-full"
        value={platformSettings.insuranceVerificationMode ?? 'manual'}
        disabled={!canEdit}
        onChange={(e) => void persistSettings({ insuranceVerificationMode: e.target.value })}
      >
        <option value="manual">Manual COI review</option>
        <option value="api">Automated verification API</option>
      </select>
      {!canEdit && (
        <p className="text-xs text-brand-text-muted">
          Only the Founder can change third-party integrations.
        </p>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <StaffOpsPageShell
        className="adm-platform-page adm-integrations-page"
        toolbar={
          <div>
            <p className="adm-card-eyebrow">Platform</p>
            <p className="adm-workbench-subtitle">
              Payment methods and third-party service connections.
            </p>
          </div>
        }
      >
        <div className="adm-platform-settings-grid">
          <DesktopSettingsCard title="Payment methods">{paymentMethodsBody}</DesktopSettingsCard>
          <DesktopSettingsCard title="Integrations">{integrationsBody}</DesktopSettingsCard>
        </div>
      </StaffOpsPageShell>
    );
  }

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      <AppFormSection title="Payment methods">
        <div className="pb-6">{paymentMethodsBody}</div>
      </AppFormSection>

      <AppFormSection title="Integrations">
        <div className="pb-6">{integrationsBody}</div>
      </AppFormSection>
    </div>
  );
}
