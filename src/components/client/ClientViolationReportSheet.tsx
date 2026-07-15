import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  UserRound,
} from 'lucide-react';
import type { SecurityGuard, SecurityRequest } from '../../types';
import {
  canClientReportViolation,
  clientViolationCategoryLabel,
  GUARD_VIOLATION_OPTIONS,
  JOB_VIOLATION_OPTIONS,
  listClientViolationReports,
  type ClientViolationReport,
  type ClientViolationTarget,
} from '../../lib/clientViolations';
import { AppFormSheet } from '../ui/app/AppFormSheet';

export interface ClientViolationReportInput {
  target: ClientViolationTarget;
  category: string;
  description: string;
  guardId?: string;
}

interface ClientViolationReportSheetProps {
  open: boolean;
  onClose: () => void;
  request: SecurityRequest;
  hiredGuard?: SecurityGuard | null;
  onSubmit: (requestId: string, input: ClientViolationReportInput) => void | Promise<void>;
}

const TARGET_OPTIONS: {
  id: ClientViolationTarget;
  label: string;
  description: string;
  icon: typeof UserRound;
}[] = [
  {
    id: 'guard',
    label: 'Guard violation',
    description: 'Conduct, uniform, attendance, or post-order issues',
    icon: UserRound,
  },
  {
    id: 'job',
    label: 'Job violation',
    description: 'Site access, equipment, briefing, or scheduling problems',
    icon: Briefcase,
  },
];

export function ClientViolationReportSheet({
  open,
  onClose,
  request,
  hiredGuard,
  onSubmit,
}: ClientViolationReportSheetProps) {
  const [target, setTarget] = useState<ClientViolationTarget>('guard');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions = target === 'guard' ? GUARD_VIOLATION_OPTIONS : JOB_VIOLATION_OPTIONS;
  const existingReports = listClientViolationReports(request);
  const canReport = canClientReportViolation(request);

  useEffect(() => {
    if (!open) return;
    setTarget(hiredGuard ? 'guard' : 'job');
    setCategory('');
    setDescription('');
    setSubmitting(false);
  }, [open, hiredGuard, request.id]);

  useEffect(() => {
    setCategory(categoryOptions[0]?.value ?? '');
  }, [target, categoryOptions]);

  async function handleSubmit() {
    if (!description.trim() || !category || submitting) return;
    if (target === 'guard' && !hiredGuard) return;

    setSubmitting(true);
    try {
      await onSubmit(request.id, {
        target,
        category,
        description: description.trim(),
        guardId: target === 'guard' ? hiredGuard?.id : undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppFormSheet
      open={open}
      onClose={() => {
        if (submitting) return;
        onClose();
      }}
      title="Report violation"
      subtitle={`${request.title} · ${request.siteName || request.location}`}
    >
      <div className="client-violation-sheet">
        <div className="client-violation-callout">
          <ShieldAlert className="client-violation-callout-icon" aria-hidden />
          <div>
            <p className="client-violation-callout-title">Not an incident report</p>
            <p className="client-violation-callout-body">
              Guards file incident reports for on-site events. Use this form to flag guard conduct or
              job setup issues for staff review.
            </p>
          </div>
        </div>

        {!canReport && (
          <p className="client-violation-muted">
            Violations can be reported once a guard is assigned and the shift is active or complete.
          </p>
        )}

        {canReport && (
          <>
            {hiredGuard && (
              <section className="client-violation-section">
                <p className="client-violation-section-label">What are you reporting?</p>
                <div className="client-violation-target-grid">
                  {TARGET_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const selected = target === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setTarget(option.id)}
                        className={`client-violation-target-card ${selected ? 'client-violation-target-card-selected' : ''}`}
                      >
                        <div className="client-violation-target-icon-wrap">
                          <Icon className="client-violation-target-icon" aria-hidden />
                        </div>
                        <p className="client-violation-target-label">{option.label}</p>
                        <p className="client-violation-target-desc">{option.description}</p>
                      </button>
                    );
                  })}
                </div>
                {target === 'guard' && hiredGuard && (
                  <p className="client-violation-impact client-violation-impact-guard">
                    This may affect <strong>{hiredGuard.name}</strong>&apos;s performance rating.
                  </p>
                )}
                {target === 'job' && (
                  <p className="client-violation-impact client-violation-impact-job">
                    Logged for staff only — the assigned guard is not penalized.
                  </p>
                )}
              </section>
            )}

            <section className="client-violation-section">
              <p className="client-violation-section-label">Category</p>
              <div className="client-violation-chip-grid">
                {categoryOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategory(option.value)}
                    className={`client-violation-chip ${category === option.value ? 'client-violation-chip-selected' : ''}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="client-violation-section">
              <label className="client-violation-section-label" htmlFor="violation-details">
                Details
              </label>
              <textarea
                id="violation-details"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, when it occurred, and any context staff should know…"
                className="client-violation-textarea"
                rows={5}
              />
            </section>

            <button
              type="button"
              disabled={!description.trim() || !category || submitting || (target === 'guard' && !hiredGuard)}
              onClick={() => void handleSubmit()}
              className="client-violation-submit"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Submit violation report
                </>
              )}
            </button>
          </>
        )}

        {existingReports.length > 0 && (
          <section className="client-violation-history">
            <p className="client-violation-section-label">Reports on this job</p>
            <ul className="client-violation-history-list">
              {existingReports.map((report: ClientViolationReport) => (
                <li key={report.id} className="client-violation-history-card">
                  <div className="client-violation-history-card-top">
                    <span
                      className={`client-violation-history-badge ${
                        report.target === 'guard'
                          ? 'client-violation-history-badge-guard'
                          : 'client-violation-history-badge-job'
                      }`}
                    >
                      {report.target === 'guard' ? 'Guard' : 'Job'}
                    </span>
                    <span className="client-violation-history-category">
                      {clientViolationCategoryLabel(report.target, report.category)}
                    </span>
                    <span className="client-violation-history-time">
                      {new Date(report.reportedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="client-violation-history-body">{report.description}</p>
                  {report.reportedByClientName && (
                    <p className="client-violation-history-meta">Reported by {report.reportedByClientName}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {canReport && existingReports.length === 0 && (
          <p className="client-violation-footnote">
            <CheckCircle2 className="client-violation-footnote-icon" aria-hidden />
            Staff is notified immediately when you submit a report.
          </p>
        )}
      </div>
    </AppFormSheet>
  );
}
