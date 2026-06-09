import React from 'react';
import { ArrowRight, Banknote, CreditCard, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { Payment, SecurityGuard, SecurityRequest } from '../../types';
import {
  PIPELINE_SECTION_META,
  paymentPipelineSummary,
} from '../../lib/paymentPipeline';
import { PLATFORM_FEE_PER_HOUR } from '../../lib/payments';
import { JobPaymentRow } from './JobPaymentRow';

interface StaffPaymentsPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  payments: Payment[];
  isDirector: boolean;
  onReleasePayout?: (requestId: string, force?: boolean) => Promise<void>;
  onRefundPayment?: (requestId: string) => Promise<void>;
  onMarkClientPaidCash?: (requestId: string) => Promise<void>;
  onMarkGuardPaidCash?: (requestId: string) => Promise<void>;
  onDepositCashToStripe?: (requestId: string) => Promise<void>;
}

function PipelineSection({
  stage,
  items,
  guards,
  payments,
  isDirector,
  onReleasePayout,
  onRefundPayment,
  onMarkClientPaidCash,
  onMarkGuardPaidCash,
  onDepositCashToStripe,
  readOnly = false,
  limit,
}: {
  stage: keyof typeof PIPELINE_SECTION_META;
  items: SecurityRequest[];
  guards: SecurityGuard[];
  payments: Payment[];
  isDirector: boolean;
  onReleasePayout?: (requestId: string, force?: boolean) => Promise<void>;
  onRefundPayment?: (requestId: string) => Promise<void>;
  onMarkClientPaidCash?: (requestId: string) => Promise<void>;
  onMarkGuardPaidCash?: (requestId: string) => Promise<void>;
  onDepositCashToStripe?: (requestId: string) => Promise<void>;
  readOnly?: boolean;
  limit?: number;
}) {
  const meta = PIPELINE_SECTION_META[stage];
  const visible = limit ? items.slice(0, limit) : items;

  if (visible.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-black flex items-center gap-2">
          {meta.title}
          <span className="text-[10px] font-mono font-bold text-brand-text-muted border border-brand-border rounded px-1.5 py-0.5">
            {items.length}
          </span>
        </h2>
        <p className="text-xs text-brand-text-muted mt-0.5">{meta.description}</p>
      </div>
      <div className="space-y-2">
        {visible.map((req) => (
          <JobPaymentRow
            key={req.id}
            req={req}
            guard={guards.find((g) => g.id === req.assignedGuardId)}
            payment={payments.find((p) => p.jobId === req.id)}
            isDirector={isDirector}
            readOnly={readOnly}
            onReleasePayout={onReleasePayout}
            onRefundPayment={onRefundPayment}
            onMarkClientPaidCash={onMarkClientPaidCash}
            onMarkGuardPaidCash={onMarkGuardPaidCash}
            onDepositCashToStripe={onDepositCashToStripe}
          />
        ))}
      </div>
      {limit && items.length > limit && (
        <p className="text-[10px] font-mono text-brand-text-muted">
          Showing {limit} of {items.length} settled jobs.
        </p>
      )}
    </section>
  );
}

export function StaffPaymentsPanel({
  requests,
  guards,
  payments,
  isDirector,
  onReleasePayout,
  onRefundPayment,
  onMarkClientPaidCash,
  onMarkGuardPaidCash,
  onDepositCashToStripe,
}: StaffPaymentsPanelProps) {
  const summary = paymentPipelineSummary(requests);
  const completed = requests.filter((r) => r.status === 'completed');
  const platformFees = completed.reduce(
    (sum, r) => sum + (r.platformFeePerHour ?? PLATFORM_FEE_PER_HOUR) * r.durationHours,
    0
  );

  const sectionProps = {
    guards,
    payments,
    isDirector,
    onReleasePayout,
    onRefundPayment,
    onMarkClientPaidCash,
    onMarkGuardPaidCash,
    onDepositCashToStripe,
  };

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Payments</h1>
        <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase">
          Client → platform funds → guard
        </p>
      </div>

      <div className="staff-ops-card p-4 space-y-3">
        <p className="text-xs text-brand-text-muted leading-relaxed">
          Card jobs land in Stripe automatically. Cash jobs need Director steps: record what the client handed
          you, then record what goes back to Stripe. If the guard will be paid through Stripe Connect, the{' '}
          <span className="text-brand-text">full job amount</span> must be deposited first — even though the
          client paid cash. If the guard was paid in cash, only the platform fee needs to go to Stripe.
        </p>
        <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono font-bold uppercase">
          <span className="px-2 py-1 rounded border border-amber-500/40 text-amber-400 bg-amber-500/10">Client pays</span>
          <ArrowRight className="w-3 h-3 text-brand-text-muted" />
          <span className="px-2 py-1 rounded border border-orange-500/40 text-orange-300 bg-orange-500/10">Deposit cash</span>
          <ArrowRight className="w-3 h-3 text-brand-text-muted" />
          <span className="px-2 py-1 rounded border border-brand-border text-brand-text-muted">Shift runs</span>
          <ArrowRight className="w-3 h-3 text-brand-text-muted" />
          <span className="px-2 py-1 rounded border border-brand-primary/40 text-brand-primary bg-brand-primary/10">Guard paid</span>
        </div>
        <div className="flex flex-wrap gap-4 text-[10px] font-mono text-brand-text-muted pt-1">
          <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> Card = auto in Stripe</span>
          <span className="flex items-center gap-1"><Banknote className="w-3 h-3" /> Cash = Director records</span>
          <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> Deposit = cash → Stripe ledger</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="staff-ops-card p-4">
          <p className="text-[10px] font-mono uppercase text-brand-text-muted">Awaiting client</p>
          <p className="text-2xl font-black font-mono mt-1">{summary.awaitingClient.length}</p>
          <p className="text-[10px] font-mono text-brand-text-muted mt-1">${summary.awaitingClientTotal}</p>
        </div>
        <div className="staff-ops-card p-4 ring-1 ring-orange-500/30">
          <p className="text-[10px] font-mono uppercase text-orange-300">Cash to deposit</p>
          <p className="text-2xl font-black font-mono mt-1 text-orange-300">{summary.cashDepositPending.length}</p>
          <p className="text-[10px] font-mono text-brand-text-muted mt-1">${summary.cashDepositTotal}</p>
        </div>
        <div className="staff-ops-card p-4 ring-1 ring-brand-primary/30">
          <p className="text-[10px] font-mono uppercase text-brand-primary">Pay guard</p>
          <p className="text-2xl font-black font-mono mt-1 text-brand-primary">{summary.awaitingGuardPayout.length}</p>
          <p className="text-[10px] font-mono text-brand-text-muted mt-1">${summary.guardPayoutDue} due</p>
        </div>
        <div className="staff-ops-card p-4">
          <p className="text-[10px] font-mono uppercase text-brand-text-muted">Settled</p>
          <p className="text-2xl font-black font-mono mt-1">{summary.settled.length}</p>
          <p className="text-[10px] font-mono text-brand-text-muted mt-1">${summary.settledGuardTotal}</p>
        </div>
      </div>

      <PipelineSection stage="cash-deposit-pending" items={summary.cashDepositPending} {...sectionProps} />
      <PipelineSection stage="awaiting-guard-payout" items={summary.awaitingGuardPayout} {...sectionProps} />
      <PipelineSection stage="awaiting-client" items={summary.awaitingClient} {...sectionProps} />
      <PipelineSection stage="client-paid-active" items={summary.clientPaidActive} {...sectionProps} readOnly />
      <PipelineSection
        stage="settled"
        items={summary.settled}
        {...sectionProps}
        readOnly
        limit={8}
      />

      {summary.awaitingClient.length === 0 &&
        summary.cashDepositPending.length === 0 &&
        summary.awaitingGuardPayout.length === 0 &&
        summary.clientPaidActive.length === 0 &&
        summary.settled.length === 0 && (
          <p className="text-center text-sm text-brand-text-muted font-mono py-12 staff-ops-card">
            No payment activity yet. Jobs appear here when clients post requests.
          </p>
        )}

      <div className="staff-ops-card p-5 space-y-4">
        <h2 className="text-sm font-black flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-brand-primary" />
          Completed shift revenue
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="border border-brand-border rounded-lg p-3">
            <p className="text-[10px] font-mono uppercase text-brand-text-muted">Gross client volume</p>
            <p className="text-xl font-black font-mono mt-1">
              ${completed.reduce((s, r) => s + r.estimatedPayout, 0).toLocaleString()}
            </p>
          </div>
          <div className="border border-brand-border rounded-lg p-3">
            <p className="text-[10px] font-mono uppercase text-brand-text-muted flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Guard payouts
            </p>
            <p className="text-xl font-black font-mono mt-1">${summary.settledGuardTotal.toLocaleString()}</p>
          </div>
          <div className="border border-brand-border rounded-lg p-3">
            <p className="text-[10px] font-mono uppercase text-brand-text-muted">Platform fees</p>
            <p className="text-xl font-black font-mono mt-1">${Math.round(platformFees * 100) / 100}</p>
            <p className="text-[9px] font-mono text-brand-text-muted mt-1">${PLATFORM_FEE_PER_HOUR}/hr per shift</p>
          </div>
        </div>
        {isDirector && (
          <p className="text-[10px] font-mono text-amber-400/90 border border-amber-500/30 bg-amber-500/5 rounded-lg px-3 py-2">
            Director only: record client cash, deposit that cash to Stripe, and record cash guard payouts.
            This keeps physical cash and the platform ledger aligned.
          </p>
        )}
      </div>
    </div>
  );
}
