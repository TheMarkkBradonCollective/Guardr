import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { SecurityRequest, ShiftAuditViolation } from '../../types';
import { guardOpenDisputableViolations } from '../../lib/shiftCheckpointReview';
import { guardCanDisputeViolation } from '../../lib/shiftAuditViolations';

interface GuardShiftAuditDisputesProps {
  guardId: string;
  requests: SecurityRequest[];
  onDispute?: (requestId: string, violationId: string, note: string) => void | Promise<void>;
}

function violationTitle(v: ShiftAuditViolation): string {
  return `${v.label} · ${v.checkpoint}`;
}

export function GuardShiftAuditDisputes({
  guardId,
  requests,
  onDispute,
}: GuardShiftAuditDisputesProps) {
  const rows = guardOpenDisputableViolations(guardId, requests);
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  if (!rows.length) return null;

  return (
    <section className="guard-audit-disputes-section space-y-3">
      <div>
        <h3 className="guard-factors-heading flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Shift audit violations
        </h3>
        <p className="guard-factors-subheading">
          Dispute client or automatic flags within 48 hours. After that, unresolved items are auto-upheld.
        </p>
      </div>
      <div className="space-y-3">
        {rows.map(({ request, violation }) => {
          const canDispute = guardCanDisputeViolation(violation);
          const busy = submittingId === violation.id;
          return (
            <div key={violation.id} className="rounded-2xl border border-brand-border p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{violationTitle(violation)}</p>
                  <p className="text-xs text-brand-text-muted">{request.title}</p>
                </div>
                <span className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  {violation.status}
                </span>
              </div>
              <p className="text-xs text-brand-text-muted leading-relaxed">{violation.description}</p>
              {violation.dispute?.guardNote ? (
                <p className="text-xs text-brand-text-muted">
                  Your dispute: {violation.dispute.guardNote}
                </p>
              ) : canDispute && onDispute ? (
                <div className="space-y-2 pt-1">
                  <textarea
                    value={noteById[violation.id] ?? ''}
                    onChange={(e) => setNoteById((m) => ({ ...m, [violation.id]: e.target.value }))}
                    rows={2}
                    className="app-input w-full text-sm"
                    placeholder="Explain why this flag should be removed..."
                  />
                  <button
                    type="button"
                    disabled={busy || !(noteById[violation.id] ?? '').trim()}
                    onClick={() => {
                      setSubmittingId(violation.id);
                      void Promise.resolve(
                        onDispute(request.id, violation.id, noteById[violation.id] ?? '')
                      ).finally(() => setSubmittingId(null));
                    }}
                    className="app-button-outline app-btn-sm gap-1.5"
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Submit dispute
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
