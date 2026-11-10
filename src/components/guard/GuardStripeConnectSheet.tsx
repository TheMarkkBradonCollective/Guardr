import React from 'react';
import { Link2, Loader2 } from 'lucide-react';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { AppButton } from '../ui/AppButton';
import { GuardrStripeConnectEmbed } from '../payments/GuardrStripeConnectEmbed';

interface GuardStripeConnectSheetProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void | Promise<void>;
  pending?: boolean;
  error?: string | null;
  resumeSetup?: boolean;
  /** When set, renders Stripe Connect embedded onboarding inside Guardr. */
  connectAccountId?: string | null;
  onConnectComplete?: () => void;
}

export function GuardStripeConnectSheet({
  open,
  onClose,
  onContinue,
  pending = false,
  error = null,
  resumeSetup = false,
  connectAccountId = null,
  onConnectComplete,
}: GuardStripeConnectSheetProps) {
  const embedded = Boolean(connectAccountId);

  return (
    <AppFormSheet
      open={open}
      onClose={onClose}
      title={resumeSetup ? 'Finish bank setup' : 'Connect your bank'}
      subtitle="Secure payouts through Stripe — in Guardr"
    >
      <div className="space-y-4">
        {!embedded && (
          <>
            <p className="text-sm text-brand-text-muted leading-relaxed">
              {resumeSetup
                ? 'Your payout account still needs a few details before Guardr can send earnings to your bank.'
                : 'Guardr uses Stripe Connect for online payouts. You will enter bank details in the secure form below — without leaving the app.'}
            </p>
            <ul className="text-sm text-brand-text-muted space-y-2 list-disc list-inside leading-relaxed">
              <li>Bank details stay with Stripe — Guardr never stores your account number</li>
              <li>Works in the Android app and browser</li>
              <li>Payouts are sent after staff releases your earnings for a completed job</li>
            </ul>
          </>
        )}

        {error && (
          <p className="text-sm text-red-500 border border-red-500/30 bg-red-500/10 rounded-lg px-3 py-2 leading-relaxed">
            {error}
          </p>
        )}

        {embedded && connectAccountId ? (
          <GuardrStripeConnectEmbed
            accountId={connectAccountId}
            onComplete={() => {
              onConnectComplete?.();
              onClose();
            }}
          />
        ) : (
          <AppButton variant="primary" fullWidth disabled={pending} onClick={() => void onContinue()}>
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Starting setup…
              </>
            ) : (
              resumeSetup ? 'Continue bank setup' : 'Start secure setup'
            )}
          </AppButton>
        )}

        {!embedded && (
          <AppButton variant="outline" fullWidth onClick={onClose} disabled={pending}>
            Not now
          </AppButton>
        )}

        {!embedded && (
          <p className="text-xs text-brand-text-muted flex items-start gap-2 leading-relaxed">
            <Link2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Stripe may ask for identity verification required for payouts.
          </p>
        )}
      </div>
    </AppFormSheet>
  );
}
