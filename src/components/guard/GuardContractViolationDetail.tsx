import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock3,
  Loader2,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import type { GuardContractViolation } from '../../lib/guardContractViolations';
import { AppSubScreenHeader } from '../ui/app/AppPrimitives';

interface GuardContractViolationDetailProps {
  violation: GuardContractViolation;
  onBack: () => void;
  onOpenDisputeStatus?: () => void;
  onDispute?: (requestId: string, violationId: string, note: string) => void | Promise<void>;
}

export function GuardContractViolationDetail({
  violation,
  onBack,
  onOpenDisputeStatus,
  onDispute,
}: GuardContractViolationDetailProps) {
  const [avoidOpen, setAvoidOpen] = useState(true);
  const [note, setNote] = useState(violation.disputeNote ?? '');
  const [submitting, setSubmitting] = useState(false);

  const showDisputeForm =
    violation.kind === 'shift-audit' &&
    violation.canDispute &&
    !!violation.requestId &&
    !!violation.violationId &&
    !!onDispute;

  const showDisputeStatusButton =
    violation.kind === 'shift-audit' &&
    (violation.disputeRejected || violation.disputeAccepted || !!violation.disputeNote);

  return (
    <div className="guard-contract-violations-screen">
      <AppSubScreenHeader title={violation.title} onBack={onBack} backLabel="Violations" />
      <div className="guard-contract-violations-scroll">
        <section className="guard-contract-violations-intro">
          <p>
            This violation is based on your Guardr platform policies and the accountability
            requirements for this shift. Repeated violations can affect your tier and account
            standing.
          </p>
        </section>

        <section className="guard-contract-violation-detail-card">
          <h2 className="guard-contract-violation-detail-card-title">Contract violation details</h2>
          <p className="guard-contract-violation-detail-card-subtitle">
            {violation.jobTitle}
            <span aria-hidden> · </span>
            {violation.occurredAt
              ? new Date(violation.occurredAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : ''}
          </p>
          <dl className="guard-contract-violation-detail-rows">
            {violation.details.map((row) => (
              <div key={`${row.label}-${row.value}`} className="guard-contract-violation-detail-row">
                <dt>{row.label}</dt>
                <dd className={row.highlight ? 'guard-contract-violation-detail-row-highlight' : undefined}>
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="guard-contract-violation-avoid">
          <button
            type="button"
            className="guard-contract-violation-avoid-toggle"
            onClick={() => setAvoidOpen((open) => !open)}
            aria-expanded={avoidOpen}
          >
            <span>How to avoid this violation</span>
            {avoidOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {avoidOpen ? (
            <ul className="guard-contract-violation-avoid-list">
              {violation.avoidTips.map((tip) => (
                <li key={tip}>
                  {tip.includes('clock') || tip.includes('Arrive') ? (
                    <Clock3 className="guard-contract-violation-avoid-icon" aria-hidden />
                  ) : tip.includes('location') || tip.includes('site') || tip.includes('post') ? (
                    <MapPin className="guard-contract-violation-avoid-icon" aria-hidden />
                  ) : (
                    <MessageSquare className="guard-contract-violation-avoid-icon" aria-hidden />
                  )}
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {showDisputeForm ? (
          <section className="guard-contract-violation-dispute-form">
            <label className="guard-contract-violation-dispute-label" htmlFor="violation-dispute-note">
              Explain why this flag should be removed
            </label>
            <textarea
              id="violation-dispute-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="app-input w-full text-sm"
              placeholder="Add details for staff review..."
            />
            <button
              type="button"
              disabled={submitting || !note.trim()}
              className="app-button-primary w-full"
              onClick={() => {
                if (!violation.requestId || !violation.violationId) return;
                setSubmitting(true);
                void Promise.resolve(
                  onDispute!(violation.requestId, violation.violationId, note.trim())
                ).finally(() => setSubmitting(false));
              }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit dispute'}
            </button>
          </section>
        ) : null}

        {showDisputeStatusButton && onOpenDisputeStatus ? (
          <button type="button" className="app-button-outline w-full" onClick={onOpenDisputeStatus}>
            View dispute status
          </button>
        ) : null}
      </div>
    </div>
  );
}

interface GuardContractViolationDisputeStatusProps {
  violation: GuardContractViolation;
  onBack: () => void;
  onOpenDetails: () => void;
}

export function GuardContractViolationDisputeStatus({
  violation,
  onBack,
  onOpenDetails,
}: GuardContractViolationDisputeStatusProps) {
  const rejected = violation.disputeRejected;
  const accepted = violation.disputeAccepted;

  return (
    <div className="guard-contract-violations-screen">
      <AppSubScreenHeader title="Dispute status" onBack={onBack} backLabel="Performance" />
      <div className="guard-contract-violations-scroll guard-contract-violation-dispute-status">
        <div className="guard-contract-violation-dispute-illustration" aria-hidden>
          <AlertTriangle className="guard-contract-violation-dispute-illustration-icon" />
        </div>
        <h2 className="guard-contract-violation-dispute-title">
          {rejected
            ? 'Your dispute was rejected'
            : accepted
              ? 'Your dispute was accepted'
              : 'Your dispute is under review'}
        </h2>
        <p className="guard-contract-violation-dispute-copy">
          {rejected
            ? 'Thanks for providing additional details to review. The review confirmed there was a violation of your Guardr platform policies.'
            : accepted
              ? 'Thanks for providing additional details. Staff sided with you and this violation was removed from your record.'
              : 'Your dispute note is with staff for review. You will be notified when a decision is made.'}
        </p>

        <div className="guard-contract-violation-dispute-summary">
          <AlertTriangle className="guard-contract-violation-dispute-summary-icon" aria-hidden />
          <div>
            <p className="guard-contract-violation-dispute-summary-title">{violation.title}</p>
            <p className="guard-contract-violation-dispute-summary-job">{violation.jobTitle}</p>
            <p className="guard-contract-violation-dispute-summary-date">
              {new Date(violation.occurredAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="guard-contract-violation-dispute-actions">
          <button type="button" className="app-button-primary w-full" onClick={onBack}>
            Got it
          </button>
          <button type="button" className="app-button-outline w-full" onClick={onOpenDetails}>
            Violation details
          </button>
        </div>
      </div>
    </div>
  );
}
