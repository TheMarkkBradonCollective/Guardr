import React, { useEffect, useState } from 'react';
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
import { AlertTriangle, Loader2 } from 'lucide-react';

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
      subtitle={
        hiredGuard
          ? `Report a guard or job issue on "${request.title}". Incident reports are filed separately by the guard for site record-keeping.`
          : `Report a job issue on "${request.title}".`
      }
    >
      <div className="space-y-4">
        {!canReport && (
          <p className="text-sm text-brand-text-muted leading-relaxed">
            Violations can be reported once a guard is assigned and the shift is active or complete.
          </p>
        )}

        {canReport && (
          <>
            {hiredGuard && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-brand-text-muted uppercase tracking-wide">
                  What are you reporting?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(['guard', 'job'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTarget(option)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                        target === option
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                          : 'border-brand-border bg-brand-bg-sec text-brand-text'
                      }`}
                    >
                      {option === 'guard' ? 'Guard violation' : 'Job violation'}
                    </button>
                  ))}
                </div>
                {target === 'guard' && (
                  <p className="text-xs text-brand-text-muted leading-relaxed">
                    Guard violations affect {hiredGuard.name}&apos;s performance rating.
                  </p>
                )}
                {target === 'job' && (
                  <p className="text-xs text-brand-text-muted leading-relaxed">
                    Job violations are logged for staff review and do not penalize the guard.
                  </p>
                )}
              </div>
            )}

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-brand-text-muted">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="uber-input w-full"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-brand-text-muted">Details</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened so staff can review…"
                className="uber-input w-full min-h-[120px] resize-y"
                rows={4}
              />
            </label>

            <button
              type="button"
              disabled={!description.trim() || !category || submitting || (target === 'guard' && !hiredGuard)}
              onClick={() => void handleSubmit()}
              className="app-button-primary w-full disabled:opacity-50 gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Submit violation report'
              )}
            </button>
          </>
        )}

        {existingReports.length > 0 && (
          <div className="border-t border-brand-border pt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
              Reports on this job
            </p>
            <ul className="space-y-2">
              {existingReports.map((report: ClientViolationReport) => (
                <li
                  key={report.id}
                  className="rounded-xl border border-brand-border bg-brand-bg-sec px-3 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <AlertTriangle className="w-3.5 h-3.5 text-status-warning shrink-0" />
                    <span className="font-semibold">
                      {report.target === 'guard' ? 'Guard' : 'Job'} ·{' '}
                      {clientViolationCategoryLabel(report.target, report.category)}
                    </span>
                    <span className="text-xs text-brand-text-muted">
                      {new Date(report.reportedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-brand-text-muted mt-1 leading-relaxed">{report.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AppFormSheet>
  );
}
