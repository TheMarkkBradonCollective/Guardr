import React from 'react';
import { ArrowRight, Banknote, CreditCard, DollarSign, TrendingUp } from 'lucide-react';
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
}: StaffPaymentsPanelProps) {
  const summary = paymentPipelineSummary(requests);
  const completed = requests.filter((r) => r.status === 'completed');
  const platformFees = completed.reduce(
    (sum, r) => sum + (r.platformFeePerHour ?? PLATFORM_FEE_PER_HOUR) * r.durationHours,
    0
  );

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Payments</h1>
        <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase">
          Client payment → shift runs → guard payout
        </p>
      </div>

      <div className="staff-ops-card p-4 space-y-3">
        <p className="text-xs text-brand-text-muted leading-relaxed">
          Every job moves through three money steps. The client pays (Stripe checkout or Director records cash),
          the shift runs, then staff pays the guard (Stripe Connect or Director records cash).
        </p>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold uppercase">
          <span className="px-2 py-1 rounded border border-amber-500/40 text-amber-400 bg-amber-500/10">1 · Client pays</span>
          <ArrowRight className="w-3 h-3 text-brand-text-muted" />
          <span className="px-2 py-1 rounded border border-brand-border text-brand-text-muted">2 · Shift runs</span>
          <ArrowRight className="w-3 h-3 text-brand-text-muted" />
          <span className="px-2 py-1 rounded border border-brand-primary/40 text-brand-primary bg-brand-primary/10">3 · Guard paid</span>
        </div>
        <div className="flex flex-wrap gap-4 text-[10px] font-mono text-brand-text-muted pt-1">
          <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> Stripe = card / Connect</span>
          <span className="flex items-center gap-1"><Banknote className="w-3 h-3" /> Cash = Director records only</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="staff-ops-card p-4">
          <p className="text-[10px] font-mono uppercase text-brand-text-muted">Awaiting client</p>
          <p className="text-2xl font-black font-mono mt-1">{summary.awaitingClient.length}</p>
          <p className="text-[10px] font-mono text-brand-text-muted mt-1">${summary.awaitingClientTotal} outstanding</p>
        </div>
        <div className="staff-ops-card p-4 ring-1 ring-brand-primary/30">
          <p className="text-[10px] font-mono uppercase text-brand-primary">Ready to pay guard</p>
          <p className="text-2xl font-black font-mono mt-1 text-brand-primary">{summary.awaitingGuardPayout.length}</p>
          <p className="text-[10px] font-mono text-brand-text-muted mt-1">${summary.guardPayoutDue} due</p>
        </div>
        <div className="staff-ops-card p-4">
          <p className="text-[10px] font-mono uppercase text-brand-text-muted">Settled</p>
          <p className="text-2xl font-black font-mono mt-1">{summary.settled.length}</p>
          <p className="text-[10px] font-mono text-brand-text-muted mt-1">${summary.settledGuardTotal} to guards</p>
        </div>
      </div>

      <PipelineSection
        stage="awaiting-guard-payout"
        items={summary.awaitingGuardPayout}
        guards={guards}
        payments={payments}
        isDirector={isDirector}
        onReleasePayout={onReleasePayout}
        onRefundPayment={onRefundPayment}
        onMarkClientPaidCash={onMarkClientPaidCash}
        onMarkGuardPaidCash={onMarkGuardPaidCash}
      />

      <PipelineSection
        stage="awaiting-client"
        items={summary.awaitingClient}
        guards={guards}
        payments={payments}
        isDirector={isDirector}
        onReleasePayout={onReleasePayout}
        onRefundPayment={onRefundPayment}
        onMarkClientPaidCash={onMarkClientPaidCash}
        onMarkGuardPaidCash={onMarkGuardPaidCash}
      />

      <PipelineSection
        stage="client-paid-active"
        items={summary.clientPaidActive}
        guards={guards}
        payments={payments}
        isDirector={isDirector}
        readOnly
        onReleasePayout={onReleasePayout}
        onRefundPayment={onRefundPayment}
        onMarkClientPaidCash={onMarkClientPaidCash}
        onMarkGuardPaidCash={onMarkGuardPaidCash}
      />

      <PipelineSection
        stage="settled"
        items={summary.settled}
        guards={guards}
        payments={payments}
        isDirector={isDirector}
        readOnly
        limit={8}
        onReleasePayout={onReleasePayout}
        onRefundPayment={onRefundPayment}
        onMarkClientPaidCash={onMarkClientPaidCash}
        onMarkGuardPaidCash={onMarkGuardPaidCash}
      />

      {summary.awaitingClient.length === 0 &&
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
            Director: cash client payments and cash guard payouts are your override when money changes hands offline.
            Administrators can release Stripe payouts only.
          </p>
        )}
      </div>
    </div>
  );
}
