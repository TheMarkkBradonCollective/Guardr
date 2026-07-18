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
import { canManageStaffPlatformContent } from '../../lib/permissions';
import { fetchIntegrationHealth } from '../../lib/integrationApi';
import { INTEGRATION_ENV_HINTS, type IntegrationHealth } from '../../lib/integrationProviders';
import { fetchPaymentProcessorHealth } from '../../lib/paymentProcessorApi';
import type { CardPaymentProcessor, PaymentProcessorHealth } from '../../lib/paymentProcessors';
import { CARD_PROCESSOR_LABELS, processorEnvHint } from '../../lib/paymentProcessors';
import { useStyletron } from 'baseui';
import { Block } from 'baseui/block';
import { HeadingXSmall, LabelSmall, LabelXSmall, ParagraphSmall } from 'baseui/typography';
import { AppFormSection } from '../ui/app/AppPrimitives';
import { AppSwitch } from '../ui/AppSwitch';
import { useDevice } from '../../lib/platform';
import { WorkbenchToolbar } from '../baseui/layout/WorkbenchLayout';
import { GuardrCard } from '../baseui/GuardrCard';
import { GuardrTag } from '../baseui/GuardrTag';
import { showAppToast } from '../ui/AppToast';
import { StaffOpsPageShell } from './StaffOpsPageShell';

interface StaffIntegrationsPanelProps {
  currentUser: SessionUser;
  platformSettings: PlatformSettings;
  onUpdateStaffIntegrations?: (
    patch: Partial<StaffIntegrationsPatch>
  ) => void | Promise<void>;
}

type StaffIntegrationsPatch = Pick<
  PlatformSettings,
  | 'paymentStripeEnabled'
  | 'paymentSquareEnabled'
  | 'smsNotificationsEnabled'
  | 'backgroundCheckProvider'
  | 'insuranceVerificationMode'
>;

function DesktopSettingsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <GuardrCard>
      <HeadingXSmall marginTop={0} marginBottom="scale500" $style={{ fontWeight: 700 }}>
        {title}
      </HeadingXSmall>
      {children}
    </GuardrCard>
  );
}

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <GuardrTag kind={connected ? 'success' : 'warning'} closeable={false}>
      {connected ? 'Connected' : 'Not connected'}
    </GuardrTag>
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
    <Block display="flex" flexDirection="column" gridGap="scale500">
      <LabelXSmall color="contentSecondary" margin={0} $style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
        Current mode: {modeLabel}
      </LabelXSmall>
      <ParagraphSmall color="contentSecondary" margin={0} $style={{ lineHeight: 1.55 }}>
        {modeDescription}
      </ParagraphSmall>
      {children}
      {readOnlyNote && (
        <LabelXSmall color="contentSecondary" margin={0}>
          {readOnlyNote}
        </LabelXSmall>
      )}
    </Block>
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
  const [, theme] = useStyletron();
  const highlighted = primary && enabled;
  return (
    <Block
      display="flex"
      alignItems="flex-start"
      justifyContent="space-between"
      gridGap="scale500"
      padding="scale500"
      backgroundColor={highlighted ? 'accent50' : undefined}
      $style={{
        borderRadius: '12px',
        border: `1px solid ${highlighted ? theme.colors.accent : theme.colors.borderOpaque}`,
      }}
    >
      <Block flex="1" minWidth={0}>
        <Block display="flex" alignItems="center" gridGap="scale200" $style={{ flexWrap: 'wrap' }}>
          <LabelSmall margin={0} $style={{ fontWeight: 600 }}>{title}</LabelSmall>
          {!healthLoading && <ConnectionBadge connected={connected} />}
        </Block>
        <LabelXSmall color="contentSecondary" display="block" marginTop="scale100" $style={{ lineHeight: 1.5 }}>
          {subtitle}
        </LabelXSmall>
        {!connected && !enabled && envHint && (
          <LabelXSmall display="block" marginTop="scale200" $style={{ color: theme.colors.warning }}>
            {envHint}
          </LabelXSmall>
        )}
        {enabled && !connected && envHint && (
          <LabelXSmall display="block" marginTop="scale200" $style={{ color: theme.colors.warning }}>
            Enabled but not connected — configure env before this integration can run.
          </LabelXSmall>
        )}
      </Block>
      <AppSwitch
        checked={enabled}
        disabled={!canEdit || disabled}
        onChange={() => onToggle()}
        ariaLabel={`Toggle ${title}`}
      />
    </Block>
  );
}

export function StaffIntegrationsPanel({
  currentUser,
  platformSettings,
  onUpdateStaffIntegrations,
}: StaffIntegrationsPanelProps) {
  const { formFactor } = useDevice();
  const canEdit = canManageStaffPlatformContent(currentUser);
  const isDesktop = formFactor === 'desktop';
  const readOnlyNote = !canEdit
    ? 'View-only — Manager access or above is required to change integrations.'
    : undefined;

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

  const persistSettings = async (patch: Partial<StaffIntegrationsPatch>) => {
    if (!onUpdateStaffIntegrations || !canEdit) return;
    await onUpdateStaffIntegrations(patch);
  };

  const isProcessorConnected = (processor: CardPaymentProcessor): boolean => {
    if (!processorHealth) return false;
    return processor === 'stripe'
      ? processorHealth.stripe.configured
      : processorHealth.square.configured;
  };

  const persistPaymentModes = async (nextStripe: boolean, nextSquare: boolean) => {
    if (!onUpdateStaffIntegrations) return;
    if (!nextStripe && !nextSquare) {
      showAppToast('Enable at least one payment method.', { tone: 'error' });
      return;
    }
    setSavingModes(true);
    try {
      await onUpdateStaffIntegrations({
        paymentStripeEnabled: nextStripe,
        paymentSquareEnabled: nextSquare,
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
          <WorkbenchToolbar
            eyebrow="Platform"
            subtitle="Payment methods and third-party service connections."
          />
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
