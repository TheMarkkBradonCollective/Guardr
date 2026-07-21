import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import {
  formatViolationListDate,
  type GuardContractViolation,
} from '../../lib/guardContractViolations';
import { AppSubScreenHeader } from '../ui/app/AppPrimitives';

interface GuardContractViolationsListProps {
  violations: GuardContractViolation[];
  onBack: () => void;
  onSelect: (violationId: string) => void;
}

function statusClass(tone: GuardContractViolation['statusTone']): string {
  switch (tone) {
    case 'rejected':
      return 'guard-contract-violation-status-rejected';
    case 'accepted':
      return 'guard-contract-violation-status-accepted';
    case 'review':
      return 'guard-contract-violation-status-review';
    case 'open':
      return 'guard-contract-violation-status-open';
    default:
      return 'guard-contract-violation-status-neutral';
  }
}

export function GuardContractViolationsList({
  violations,
  onBack,
  onSelect,
}: GuardContractViolationsListProps) {
  return (
    <div className="guard-contract-violations-screen">
      <AppSubScreenHeader title="Contract violations" onBack={onBack} backLabel="Performance" />
      <div className="guard-contract-violations-scroll">
        <section className="guard-contract-violations-intro">
          <p>
            Violations are based on your Guardr Independent Contractor Agreement, platform access
            policy, and shift accountability requirements. Repeated violations can lead to account
            restrictions.
          </p>
          <p>
            Shift accountability violations are considered from your most recent completed shifts,
            then removed once resolved or expired.
          </p>
        </section>

        <h2 className="guard-contract-violations-section-title">Your contract violations</h2>

        {violations.length === 0 ? (
          <div className="guard-contract-violations-empty">
            <AlertTriangle className="guard-contract-violations-empty-icon" aria-hidden />
            <p>No contract violations on your account.</p>
          </div>
        ) : (
          <ul className="guard-contract-violations-list">
            {violations.map((violation) => (
              <li key={violation.id}>
                <button
                  type="button"
                  className="guard-contract-violations-row"
                  onClick={() => onSelect(violation.id)}
                >
                  <div className="guard-contract-violations-row-main">
                    <div className="guard-contract-violations-row-top">
                      <span className="guard-contract-violations-row-title">{violation.title}</span>
                      <span className="guard-contract-violations-row-date">
                        {formatViolationListDate(violation.occurredAt)}
                      </span>
                    </div>
                    <p className="guard-contract-violations-row-job">{violation.jobTitle}</p>
                    {violation.statusLabel ? (
                      <span className={`guard-contract-violation-status ${statusClass(violation.statusTone)}`}>
                        {violation.statusLabel}
                      </span>
                    ) : null}
                  </div>
                  <ChevronRight className="guard-contract-violations-row-chevron" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
