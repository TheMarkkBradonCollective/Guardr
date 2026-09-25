import React, { useEffect, useState } from 'react';
import { Check, Clock, CreditCard, IdCard } from 'lucide-react';
import type { SecurityGuard } from '../../types';
import {
  isStaffAccountApproved,
  isStaffAccountPending,
} from '../../lib/accountStatus';
import { getStaffActivationChecklist, staffActivationProgress, staffNeedsIdReactivation } from '../../lib/staffAccountActivation';
import {
  GuardIdentityVerificationPanel,
  type GuardIdentityVerificationPayload,
  type IdentityVerificationSubmitResult,
} from '../profile/GuardIdentityVerificationPanel';
import { GuardStripeConnectSheet } from '../guard/GuardStripeConnectSheet';
import { createConnectAccount, createConnectAccountLink, getConnectAccountStatus } from '../../lib/stripeApi';
import { WfBadge } from '../ui/wireframe';
import { UserManualDownloads } from '../docs/UserManualDownloads';
import { userFacingError } from '../../lib/userFacingError';

interface StaffActivationUploadChecklistProps {
  member: SecurityGuard;
  onSubmitIdentityVerification: (
    payload: GuardIdentityVerificationPayload,
  ) => Promise<IdentityVerificationSubmitResult>;
  onUpdateStripeAccount: (staffId: string, accountId: string) => void | Promise<void>;
}

export function StaffActivationUploadChecklist({
  member,
  onSubmitIdentityVerification,
  onUpdateStripeAccount,
}: StaffActivationUploadChecklistProps) {
  const [stripePayoutsEnabled, setStripePayoutsEnabled] = useState(false);
  const [connectSheetOpen, setConnectSheetOpen] = useState(false);
  const [connectPending, setConnectPending] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    if (!member.stripeConnectAccountId) {
      setStripePayoutsEnabled(false);
      return;
    }
    let cancelled = false;
    void getConnectAccountStatus(member.stripeConnectAccountId)
      .then((status) => {
        if (!cancelled) setStripePayoutsEnabled(status.payoutsEnabled);
      })
      .catch(() => {
        if (!cancelled) setStripePayoutsEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [member.stripeConnectAccountId]);

  const checklist = getStaffActivationChecklist(member, { stripePayoutsEnabled });
  const stripeStep = checklist.find((s) => s.id === 'stripe_payout');

  const handleConnectStripeContinue = async () => {
    setConnectPending(true);
    setConnectError(null);
    try {
      let accountId = member.stripeConnectAccountId;
      if (!accountId) {
        const result = await createConnectAccount({
          staffId: member.id,
          email: member.email,
          name: member.name,
        });
        accountId = result.accountId;
        await onUpdateStripeAccount(member.id, accountId);
      }
      const { url } = await createConnectAccountLink(accountId);
      setConnectSheetOpen(false);
      window.location.assign(url);
    } catch (e: unknown) {
      setConnectError(userFacingError(e, 'Failed to start Stripe onboarding'));
    } finally {
      setConnectPending(false);
    }
  };

  return (
    <div className="space-y-6">
      {checklist.map((step) => (
        <div
          key={step.id}
          className="rounded-xl border border-brand-border bg-brand-surface p-4 flex items-start gap-3"
        >
          <span
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              step.complete ? 'bg-emerald-500/15 text-emerald-600' : 'bg-brand-bg-sec text-brand-text-muted'
            }`}
          >
            {step.complete ? <Check className="h-4 w-4" /> : step.id === 'stripe_payout' ? <CreditCard className="h-4 w-4" /> : step.id === 'government_id' ? <IdCard className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-sm">{step.label}</p>
              <WfBadge tone={step.complete ? 'success' : 'warning'}>
                {step.complete ? 'Complete' : 'Needed'}
              </WfBadge>
            </div>
            {step.detail && (
              <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">{step.detail}</p>
            )}
          </div>
        </div>
      ))}

      <section className="space-y-3">
        <p className="text-sm font-semibold">Government ID</p>
        <GuardIdentityVerificationPanel
          guard={member}
          onSubmit={onSubmitIdentityVerification}
          compact
        />
      </section>

      <section className="space-y-3">
        <p className="text-sm font-semibold">Compensation payouts</p>
        <p className="text-xs text-brand-text-muted leading-relaxed">
          Connect a bank account through Stripe so Guardr can send your staff revenue-share and hourly
          compensation. Details stay with Stripe — Guardr never stores your account number.
        </p>
        <button
          type="button"
          className="app-button-primary w-full"
          onClick={() => setConnectSheetOpen(true)}
        >
          {stripeStep?.complete ? 'Review bank setup on Stripe' : 'Connect bank via Stripe'}
        </button>
      </section>

      <GuardStripeConnectSheet
        open={connectSheetOpen}
        onClose={() => setConnectSheetOpen(false)}
        onContinue={handleConnectStripeContinue}
        pending={connectPending}
        error={connectError}
        resumeSetup={!!member.stripeConnectAccountId}
      />
    </div>
  );
}

interface StaffAccountPendingScreenProps {
  member: SecurityGuard;
  onSubmitIdentityVerification: (
    payload: GuardIdentityVerificationPayload,
  ) => Promise<IdentityVerificationSubmitResult>;
  onUpdateStripeAccount: (staffId: string, accountId: string) => void | Promise<void>;
}

export function StaffAccountPendingScreen({
  member,
  onSubmitIdentityVerification,
  onUpdateStripeAccount,
}: StaffAccountPendingScreenProps) {
  const pending = isStaffAccountPending(member);
  const approved = isStaffAccountApproved(member);
  const reactivation = staffNeedsIdReactivation(member);
  const progress = staffActivationProgress(member);

  const title = reactivation
    ? 'Complete credential verification'
    : approved
      ? 'Finish onboarding'
      : pending
        ? 'Complete your staff application'
        : 'Staff activation';

  const subtitle = reactivation
    ? 'Your ops access is restricted until your government-issued ID is uploaded and verified. Submit ID front, back, and a live selfie to continue.'
    : approved
      ? 'Your application is approved. Complete government ID verification and Stripe bank setup — Guardr activates your ops access when both are done.'
      : 'Sign in anytime to upload your government ID and connect payouts. A Director reviews your application while you finish these steps.';

  const eyebrow = reactivation ? 'Staff reactivation' : 'Staff activation';

  return (
    <div className="adm-pending-page flex min-h-full flex-col overflow-y-auto overscroll-contain bg-brand-bg">
      <div className="shrink-0 border-b border-brand-border px-5 pb-6 pt-8 text-center">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-brand-border bg-brand-bg-sec">
          <Clock className="h-7 w-7 text-brand-primary" />
        </span>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-primary">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-black tracking-tight text-brand-text">{title}</h1>
        <p className="mt-2 text-left text-sm font-medium leading-relaxed text-brand-text-muted">
          {subtitle}
        </p>
        <div className="mt-5 text-left">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-brand-text-muted">{progress.requirementLabel}</span>
            <span className="text-xs font-bold tabular-nums text-brand-primary">{progress.percent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-brand-border">
            <div
              className="h-full rounded-full bg-brand-primary transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      </div>
      <div className="px-5 py-6">
        <StaffActivationUploadChecklist
          member={member}
          onSubmitIdentityVerification={onSubmitIdentityVerification}
          onUpdateStripeAccount={onUpdateStripeAccount}
        />
      </div>
      <div className="px-5 pb-8">
        <div className="rounded-xl border border-brand-border bg-brand-bg-sec/40 p-4">
          <UserManualDownloads audienceFilter="staff" variant="embedded" />
        </div>
      </div>
    </div>
  );
}
