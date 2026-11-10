import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { AppButton } from '../ui/AppButton';
import { guardrStripeAppearance } from '../../lib/stripe/stripeAppearance';
import {
  fetchStripePublicConfig,
  fetchStripePublishableKey,
  resetStripePublicConfigCache,
} from '../../lib/stripe/stripePublicConfig';
import { createClientPaymentIntent } from '../../lib/stripeApi';
import type { ClientEmbeddedPaymentKind } from '../../lib/stripe/stripeEmbeddedTypes';
import { userFacingError } from '../../lib/userFacingError';
import { readThemeFromDocument } from '../../lib/platform/theme';

export type GuardrStripePaymentSheetProps = {
  open: boolean;
  onClose: () => void;
  kind: ClientEmbeddedPaymentKind;
  jobId: string;
  clientEmail: string;
  amountCents: number;
  jobTitle?: string;
  title: string;
  subtitle?: string;
  onPaid?: () => void;
};

type SheetPhase = 'loading' | 'ready' | 'confirming' | 'success' | 'error';

function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function PaymentConfirmForm({
  amountCents,
  jobId,
  onPaid,
  onError,
}: {
  amountCents: number;
  jobId: string;
  onPaid?: () => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [confirming, setConfirming] = useState(false);

  const confirm = async () => {
    if (!stripe || !elements) return;
    setConfirming(true);
    onError('');
    try {
      const returnUrl = `${window.location.origin}/client/invoices?payment=success&job_id=${encodeURIComponent(jobId)}`;
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: { return_url: returnUrl },
      });
      if (error) {
        onError(error.message ?? 'Payment could not be completed');
        return;
      }
      if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
        onPaid?.();
      } else if (paymentIntent?.status === 'requires_action') {
        onError('Additional verification is still required. Follow the prompts from your bank.');
      } else {
        onError('Payment was not completed. You can try again.');
      }
    } catch (err: unknown) {
      onError(userFacingError(err, 'Payment failed'));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-border bg-brand-surface/40 p-3">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      <AppButton variant="primary" fullWidth disabled={!stripe || !elements || confirming} onClick={() => void confirm()}>
        {confirming ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Confirming {formatUsd(amountCents)}…
          </>
        ) : (
          <>Pay {formatUsd(amountCents)}</>
        )}
      </AppButton>
      <p className="text-xs text-brand-text-muted flex items-start gap-2 leading-relaxed">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Card details are processed by Stripe. Guardr never stores your full card number. 3-D Secure may appear for some cards.
      </p>
    </div>
  );
}

export function GuardrStripePaymentSheet({
  open,
  onClose,
  kind,
  jobId,
  clientEmail,
  amountCents,
  jobTitle,
  title,
  subtitle,
  onPaid,
}: GuardrStripePaymentSheetProps) {
  const [phase, setPhase] = useState<SheetPhase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeJs, setStripeJs] = useState<Stripe | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [testMode, setTestMode] = useState(false);
  const [canRunTestPayments, setCanRunTestPayments] = useState(false);

  const themeMode = readThemeFromDocument();
  const appearance = useMemo(() => guardrStripeAppearance(themeMode), [themeMode, open]);

  const bootstrap = useCallback(async () => {
    if (!open) return;
    setPhase('loading');
    setError(null);
    setClientSecret(null);
    try {
      resetStripePublicConfigCache();
      const config = await fetchStripePublicConfig();
      setCanRunTestPayments(config.canRunTestPayments);
      const { loadStripe } = await import('@stripe/stripe-js');
      const publishableKey = await fetchStripePublishableKey({ testMode });
      if (!publishableKey) {
        throw new Error(
          testMode
            ? 'Test-mode card payments are not available until a test publishable key is configured.'
            : 'Card payments are not available right now.'
        );
      }
      const stripe = await loadStripe(publishableKey);
      if (!stripe) throw new Error('Unable to load Stripe');
      setStripeJs(stripe);

      const { clientSecret: secret } = await createClientPaymentIntent({
        kind,
        jobId,
        clientEmail,
        jobTitle,
        amountCents,
        testMode: testMode || undefined,
      });
      setClientSecret(secret);
      setPhase('ready');
    } catch (err: unknown) {
      setError(userFacingError(err, 'Unable to start payment'));
      setPhase('error');
    }
  }, [open, kind, jobId, clientEmail, jobTitle, amountCents, testMode]);

  useEffect(() => {
  if (open) void bootstrap();
  else {
    setPhase('loading');
    setClientSecret(null);
    setStripeJs(null);
    setError(null);
  }
  }, [open, bootstrap, attempt]);

  const handlePaid = () => {
    setPhase('success');
    onPaid?.();
  };

  return (
    <AppFormSheet open={open} onClose={onClose} title={title} subtitle={subtitle ?? 'Pay securely in Guardr'}>
      <div className="space-y-4">
        {canRunTestPayments && (
          <label className="flex items-start gap-3 rounded-xl border border-dashed border-brand-border bg-brand-surface/40 p-3 text-sm text-brand-text">
            <input
              type="checkbox"
              className="mt-1"
              checked={testMode}
              onChange={(event) => {
                setTestMode(event.target.checked);
                setAttempt((n) => n + 1);
              }}
            />
            <span>
              <span className="font-medium">Run test payment</span>
              <span className="block text-brand-text-muted text-xs leading-relaxed mt-0.5">
                Director and above only. Uses Stripe test mode — no live charges.
              </span>
            </span>
          </label>
        )}
        {testMode && phase !== 'error' && (
          <p className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
            Test mode is on. This payment will use Stripe test keys.
          </p>
        )}
        {phase === 'loading' && <PaymentSheetLoading label="Preparing secure checkout" />}

        {phase === 'error' && (
          <PaymentSheetError
            message={error ?? 'Payment unavailable'}
            onRetry={() => setAttempt((n) => n + 1)}
            onClose={onClose}
          />
        )}

        {phase === 'success' && (
          <PackageSuccess amountCents={amountCents} onClose={onClose} />
        )}

        {phase === 'ready' && clientSecret && stripeJs && (
          <Elements stripe={stripeJs} options={{ clientSecret, appearance }}>
            <PaymentConfirmForm
              amountCents={amountCents}
              jobId={jobId}
              onPaid={handlePaid}
              onError={(msg) => {
                if (msg) {
                  setError(msg);
                  setPhase('error');
                }
              }}
            />
          </Elements>
        )}
      </div>
    </AppFormSheet>
  );
}

function PaymentSheetLoading({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <Loader2 className="w-8 h-8 animate-spin text-brand-text-muted" />
      <p className="text-sm text-brand-text-muted">{label}</p>
    </div>
  );
}

function PaymentSheetError({
  message,
  onRetry,
  onClose,
}: {
  message: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-red-500 border border-red-500/30 bg-red-500/10 rounded-lg px-3 py-2 leading-relaxed flex gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        {message}
      </p>
      <AppButton variant="primary" fullWidth onClick={onRetry}>
        Try again
      </AppButton>
      <AppButton variant="outline" fullWidth onClick={onClose}>
        Cancel
      </AppButton>
    </div>
  );
}

function PackageSuccess({ amountCents, onClose }: { amountCents: number; onClose: () => void }) {
  return (
    <div className="space-y-4 text-center py-4">
      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
      <p className="text-sm text-brand-text leading-relaxed">
        Payment of {formatUsd(amountCents)} was submitted. Guardr will mark the job paid when Stripe confirms (usually within a
        few seconds).
      </p>
      <AppButton variant="primary" fullWidth onClick={onClose}>
        Done
      </AppButton>
    </div>
  );
}
