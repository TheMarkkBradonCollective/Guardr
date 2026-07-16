import React, { useEffect, useState } from 'react';
import { SessionUser } from '../../types';
import {
  PlatformSettings,
  platformBackgroundCheckModeDescription,
  platformBackgroundCheckModeLabel,
  platformInsuranceModeDescription,
  platformInsuranceModeLabel,
  platformPaymentModeDescription,
  platformPaymentModeLabel,
  platformSmsModeDescription,
  platformSmsModeLabel,
} from '../../lib/platformSettings';
import { canManagePlatformSettings } from '../../lib/permissions';
import { fetchIntegrationHealth } from '../../lib/integrationApi';
import { INTEGRATION_ENV_HINTS, type IntegrationHealth } from '../../lib/integrationProviders';
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

function IntegrationSection({
  modeLabel,
  modeDescription,
  children,
  readOnlyNote,
}: {
  modeLabel: string;
  modeDescription: string;
  children: React.ReactNode;
  readOnlyNote?: string;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
        Current mode: {modeLabel}
      </p>
      <p className="text-sm text-brand-text-muted leading-relaxed">{modeDescription}</p>
      {children}
      {readOnlyNote && <p className="text-xs text-brand-text-muted">{readOnlyNote}</p>}
    </div>
  );
}

function IntegrationToggleCard({
  title,
  subtitle,
  connected,
  healthLoading,
  enabled,
  canEdit,
  disabled,
  onToggle,
  primary = false,
  envHint,
}: {
  title: string;
  subtitle: string;
  connected: boolean;
  healthLoading: boolean;
  enabled: boolean;
  canEdit: boolean;
  disabled?: boolean;
  onToggle: () => void;
  primary?: boolean;
  envHint?: string;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${
        primary && enabled ? 'border-brand-primary/30 bg-brand-primary/5' : 'border-brand-border'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{title}</span>
          {!healthLoading && <ConnectionBadge connected={connected} />}
        </div>
        <span className="text-xs text-brand-text-muted block mt-1 leading-relaxed">{subtitle}</span>
        {!connected && !enabled && envHint && (
          <span className="text-xs text-amber-400/90 block mt-1.5">{envHint}</span>
        )}
        {enabled && !connected && envHint && (
          <span className="text-xs text-amber-400/90 block mt-1.5">
            Enabled but not connected — configure env before this integration can run.
          </span>
        )}
      </div>
      <AppSwitch
        checked={enabled}
        disabled={!canEdit || disabled}
        onChange={() => onToggle()}
        ariaLabel={`Toggle ${title}`}
      />
    </div>
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
  const readOnlyNote = !canEdit ? 'Only the Founder can change integrations.' : undefined;

  const [stripeEnabled, setStripeEnabled] = useState(platformSettings.paymentStripeEnabled);
  const [squareEnabled, setSquareEnabled] = useState(platformSettings.paymentSquareEnabled);
  const [savingModes, setSavingModes] = useState(false);
  const [processorHealth, setProcessorHealth] = useState<PaymentProcessorHealth | null>(null);
  const [integrationHealth, setIntegrationHealth] = useState<IntegrationHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    setStripeEnabled(platformSettings.paymentStripeEnabled);
    setSquareEnabled(platformSettings.paymentSquareEnabled);
  }, [platformSettings.paymentStripeEnabled, platformSettings.paymentSquareEnabled]);

  useEffect(() => {
    let cancelled = false;
    setHealthLoading(true);
    void Promise.all([fetchPaymentProcessorHealth(), fetchIntegrationHealth()])
      .then(([payments, integrations]) => {
        if (!cancelled) {
          setProcessorHealth(payments);
          setIntegrationHealth(integrations);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProcessorHealth({
            stripe: { configured: false },
            square: { configured: false },
          });
          setIntegrationHealth({
            twilio: { configured: false },
            checkr: { configured: false },
            insuranceApi: { configured: false },
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

  const toggleConnectedIntegration = async ({
    next,
    connected,
    name,
    envHint,
    apply,
  }: {
    next: boolean;
    connected: boolean;
    name: string;
    envHint: string;
    apply: () => Promise<void>;
  }) => {
    if (!canEdit) return;
    if (next && !connected) {
      showAppToast(`${name} is not connected. ${envHint}`, { tone: 'error' });
      return;
    }
    await apply();
  };

  const smsEnabled = platformSettings.smsNotificationsEnabled === true;
  const checkrEnabled = platformSettings.backgroundCheckProvider === 'checkr';
  const insuranceApiEnabled = platformSettings.insuranceVerificationMode === 'api';

  const paymentMethodsBody = (
    <IntegrationSection
      modeLabel={platformPaymentModeLabel(platformSettings)}
      modeDescription={platformPaymentModeDescription(platformSettings)}
      readOnlyNote={readOnlyNote}
    >
      <div className="grid grid-cols-1 gap-3">
        <IntegrationToggleCard
          title={`Card (${CARD_PROCESSOR_LABELS.stripe})`}
          subtitle="Primary card processor — Stripe Checkout + Connect guard payouts"
          connected={isProcessorConnected('stripe')}
          healthLoading={healthLoading}
          enabled={stripeEnabled}
          canEdit={canEdit}
          disabled={savingModes || (!isProcessorConnected('stripe') && !stripeEnabled)}
          onToggle={() => void toggleProcessor('stripe')}
          primary
          envHint={`Connect Stripe in env before enabling. ${processorEnvHint('stripe')}`}
        />
        <IntegrationToggleCard
          title={`Card (${CARD_PROCESSOR_LABELS.square})`}
          subtitle="Alternative card processor — Square checkout for client payments"
          connected={isProcessorConnected('square')}
          healthLoading={healthLoading}
          enabled={squareEnabled}
          canEdit={canEdit}
          disabled={savingModes || (!isProcessorConnected('square') && !squareEnabled)}
          onToggle={() => void toggleProcessor('square')}
          envHint={`Connect Square in env before enabling. ${processorEnvHint('square')}`}
        />
      </div>
    </IntegrationSection>
  );

  const smsBody = (
    <IntegrationSection
      modeLabel={platformSmsModeLabel(platformSettings)}
      modeDescription={platformSmsModeDescription(platformSettings)}
      readOnlyNote={readOnlyNote}
    >
      <IntegrationToggleCard
        title="Twilio"
        subtitle="SMS notifications for job updates, approvals, and staff alerts"
        connected={integrationHealth?.twilio.configured ?? false}
        healthLoading={healthLoading}
        enabled={smsEnabled}
        canEdit={canEdit}
        disabled={!integrationHealth?.twilio.configured && !smsEnabled}
        onToggle={() =>
          void toggleConnectedIntegration({
            next: !smsEnabled,
            connected: integrationHealth?.twilio.configured ?? false,
            name: 'Twilio',
            envHint: INTEGRATION_ENV_HINTS.twilio,
            apply: () => persistSettings({ smsNotificationsEnabled: !smsEnabled }),
          })
        }
        primary
        envHint={INTEGRATION_ENV_HINTS.twilio}
      />
    </IntegrationSection>
  );

  const backgroundCheckBody = (
    <IntegrationSection
      modeLabel={platformBackgroundCheckModeLabel(platformSettings)}
      modeDescription={platformBackgroundCheckModeDescription(platformSettings)}
      readOnlyNote={readOnlyNote}
    >
      <IntegrationToggleCard
        title="Checkr"
        subtitle="Automated background screening — when off, staff review manually in Credentials"
        connected={integrationHealth?.checkr.configured ?? false}
        healthLoading={healthLoading}
        enabled={checkrEnabled}
        canEdit={canEdit}
        disabled={!integrationHealth?.checkr.configured && !checkrEnabled}
        onToggle={() =>
          void toggleConnectedIntegration({
            next: !checkrEnabled,
            connected: integrationHealth?.checkr.configured ?? false,
            name: 'Checkr',
            envHint: INTEGRATION_ENV_HINTS.checkr,
            apply: () =>
              persistSettings({
                backgroundCheckProvider: checkrEnabled ? 'manual' : 'checkr',
              }),
          })
        }
        primary
        envHint={INTEGRATION_ENV_HINTS.checkr}
      />
    </IntegrationSection>
  );

  const insuranceBody = (
    <IntegrationSection
      modeLabel={platformInsuranceModeLabel(platformSettings)}
      modeDescription={platformInsuranceModeDescription(platformSettings)}
      readOnlyNote={readOnlyNote}
    >
      <IntegrationToggleCard
        title="Automated verification API"
        subtitle="Automated COI verification — when off, staff review COI documents manually"
        connected={integrationHealth?.insuranceApi.configured ?? false}
        healthLoading={healthLoading}
        enabled={insuranceApiEnabled}
        canEdit={canEdit}
        disabled={!integrationHealth?.insuranceApi.configured && !insuranceApiEnabled}
        onToggle={() =>
          void toggleConnectedIntegration({
            next: !insuranceApiEnabled,
            connected: integrationHealth?.insuranceApi.configured ?? false,
            name: 'Insurance verification API',
            envHint: INTEGRATION_ENV_HINTS.insuranceApi,
            apply: () =>
              persistSettings({
                insuranceVerificationMode: insuranceApiEnabled ? 'manual' : 'api',
              }),
          })
        }
        primary
        envHint={INTEGRATION_ENV_HINTS.insuranceApi}
      />
    </IntegrationSection>
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
          <DesktopSettingsCard title="SMS notifications">{smsBody}</DesktopSettingsCard>
          <DesktopSettingsCard title="Background check">{backgroundCheckBody}</DesktopSettingsCard>
          <DesktopSettingsCard title="Insurance verification">{insuranceBody}</DesktopSettingsCard>
        </div>
      </StaffOpsPageShell>
    );
  }

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      <AppFormSection title="Payment methods">
        <div className="pb-6">{paymentMethodsBody}</div>
      </AppFormSection>
      <AppFormSection title="SMS notifications">
        <div className="pb-6">{smsBody}</div>
      </AppFormSection>
      <AppFormSection title="Background check">
        <div className="pb-6">{backgroundCheckBody}</div>
      </AppFormSection>
      <AppFormSection title="Insurance verification">
        <div className="pb-6">{insuranceBody}</div>
      </AppFormSection>
    </div>
  );
}
