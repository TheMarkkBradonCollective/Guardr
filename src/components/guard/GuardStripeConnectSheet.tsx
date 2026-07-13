import React from 'react';
import { ExternalLink, Link2, Loader2 } from 'lucide-react';
import { AppFormSheet } from '../ui/app/AppFormSheet';

interface GuardStripeConnectSheetProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void | Promise<void>;
  pending?: boolean;
  error?: string | null;
  resumeSetup?: boolean;
}

export function GuardStripeConnectSheet({
  open,
  onClose,
  onContinue,
  pending = false,
  error = null,
  resumeSetup = false,
}: GuardStripeConnectSheetProps) {
  return (
    <AppFormSheet
      open={open}
      onClose={onClose}
      title={resumeSetup ? 'Finish bank setup' : 'Connect your bank'}
      subtitle="Secure payouts through Stripe"
    >
      <div className="space-y-4">
        <p className="text-sm text-brand-text-muted leading-relaxed">
          {resumeSetup
            ? 'Your Stripe payout account still needs a few details before Guardr can send earnings to your bank.'
            : 'Guardr uses Stripe Connect to send online payouts directly to your bank account. You will complete a short secure setup on Stripe.'}
        </p>
        <ul className="text-sm text-brand-text-muted space-y-2 list-disc list-inside leading-relaxed">
          <li>Bank details stay with Stripe — Guardr never stores your account number</li>
          <li>You will return here automatically when setup is finished</li>
          <li>Cash pickup stays available even before bank setup is complete</li>
        </ul>

        {error && (
          <p className="text-sm text-red-500 border border-red-500/30 bg-red-500/10 rounded-lg px-3 py-2 leading-relaxed">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={pending}
          onClick={() => void onContinue()}
          className="app-button-primary w-full disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Opening Stripe...
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4" />
              {resumeSetup ? 'Continue setup on Stripe' : 'Continue to Stripe'}
            </>
          )}
        </button>

        <button type="button" onClick={onClose} disabled={pending} className="app-button-outline w-full">
          Not now
        </button>

        <p className="text-xs text-brand-text-muted flex items-start gap-2 leading-relaxed">
          <Link2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          If the Stripe page does not open, check that pop-ups and external links are allowed for Guardr.
        </p>
      </div>
    </AppFormSheet>
  );
}
