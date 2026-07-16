import React, { useEffect, useState } from 'react';
import { SessionUser } from '../../types';
import {
  PlatformSettings,
  platformPaymentModeDescription,
  platformPaymentModeLabel,
} from '../../lib/platformSettings';
import { canManagePlatformSettings } from '../../lib/permissions';
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

export function StaffIntegrationsPanel({
  currentUser,
  platformSettings,
  onUpdatePlatformSettings,
}: StaffIntegrationsPanelProps) {
  const { formFactor } = useDevice();
  const canEdit = canManagePlatformSettings(currentUser);
  const isDesktop = formFactor === 'desktop';
  const [cashEnabled, setCashEnabled] = useState(platformSettings.paymentCashEnabled);
  const [stripeEnabled, setStripeEnabled] = useState(platformSettings.paymentStripeEnabled);
  const [savingModes, setSavingModes] = useState(false);

  useEffect(() => {
    setCashEnabled(platformSettings.paymentCashEnabled);
    setStripeEnabled(platformSettings.paymentStripeEnabled);
  }, [platformSettings.paymentCashEnabled, platformSettings.paymentStripeEnabled]);

  const persistSettings = async (patch: Partial<PlatformSettings>) => {
    if (!onUpdatePlatformSettings || !canEdit) return;
    await onUpdatePlatformSettings({
      ...platformSettings,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  };

  const persistPaymentModes = async (nextCash: boolean, nextStripe: boolean) => {
    if (!onUpdatePlatformSettings) return;
    if (!nextCash && !nextStripe) {
      showAppToast('Enable at least one payment method.', { tone: 'error' });
      return;
    }
    setSavingModes(true);
    try {
      await onUpdatePlatformSettings({
        ...platformSettings,
        paymentCashEnabled: nextCash,
        paymentStripeEnabled: nextStripe,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setSavingModes(false);
    }
  };

  const toggleCash = async () => {
    if (!canEdit || savingModes) return;
    const next = !cashEnabled;
    setCashEnabled(next);
    await persistPaymentModes(next, stripeEnabled);
  };

  const toggleStripe = async () => {
    if (!canEdit || savingModes) return;
    const next = !stripeEnabled;
    setStripeEnabled(next);
    await persistPaymentModes(cashEnabled, next);
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
        <label
          className={`flex items-start gap-3 rounded-xl border border-brand-primary/30 bg-brand-primary/5 p-4 ${
            canEdit ? 'cursor-pointer' : 'opacity-90'
          }`}
        >
          <input
            type="checkbox"
            className="mt-1"
            checked={stripeEnabled}
            onChange={() => void toggleStripe()}
            disabled={!canEdit || savingModes}
          />
          <span>
            <span className="text-sm font-semibold block">Card (Stripe)</span>
            <span className="text-xs text-brand-text-muted">Primary — recommended for all jobs</span>
          </span>
        </label>
        <label
          className={`flex items-start gap-3 rounded-xl border border-brand-border p-4 ${
            canEdit ? 'cursor-pointer' : 'opacity-90'
          }`}
        >
          <input
            type="checkbox"
            className="mt-1"
            checked={cashEnabled}
            onChange={() => void toggleCash()}
            disabled={!canEdit || savingModes}
          />
          <span>
            <span className="text-sm font-semibold block">Cash</span>
            <span className="text-xs text-brand-text-muted">
              Secondary — client requests; staff confirms payment received
            </span>
          </span>
        </label>
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
