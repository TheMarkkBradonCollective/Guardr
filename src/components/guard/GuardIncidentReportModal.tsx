import React, { useState } from 'react';
import { AppModal } from '../ui/motion/AppMotion';
import { GuardrButton } from '../baseui/GuardrButton';
import {
  emptyIncidentFormInput,
  INCIDENT_CATEGORY_OPTIONS,
  INCIDENT_PRIORITY_OPTIONS,
  IncidentReportFormInput,
} from '../../lib/incidentReports';

interface GuardIncidentReportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: IncidentReportFormInput) => void | Promise<void>;
  siteName?: string;
}

export function GuardIncidentReportModal({
  open,
  onClose,
  onSubmit,
  siteName,
}: GuardIncidentReportModalProps) {
  const [form, setForm] = useState<IncidentReportFormInput>(emptyIncidentFormInput);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof IncidentReportFormInput>(key: K, value: IncidentReportFormInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || !form.actionsTaken.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(form);
      setForm(emptyIncidentFormInput());
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not file this incident report. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setForm(emptyIncidentFormInput());
    setSubmitError(null);
    onClose();
  };

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      align="center"
      ariaLabelledBy="guard-incident-report-title"
      panelClassName="p-5 space-y-4 max-h-[90vh] overflow-y-auto"
    >
      <h3 id="guard-incident-report-title" className="font-bold text-lg">
        File incident report
      </h3>
      {siteName && <p className="text-sm uber-text-muted">Site: {siteName}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="uber-label">Incident type</span>
            <select
              value={form.incidentType}
              onChange={(e) => update('incidentType', e.target.value as IncidentReportFormInput['incidentType'])}
              className="uber-input w-full"
              required
            >
              {INCIDENT_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="uber-label">Priority</span>
            <select
              value={form.priority}
              onChange={(e) => update('priority', e.target.value as IncidentReportFormInput['priority'])}
              className="uber-input w-full"
              required
            >
              {INCIDENT_PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="uber-label">When did it occur?</span>
            <input
              type="datetime-local"
              value={form.occurredAt}
              onChange={(e) => update('occurredAt', e.target.value)}
              className="uber-input w-full"
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="uber-label">Where on site?</span>
            <input
              type="text"
              value={form.locationOnSite}
              onChange={(e) => update('locationOnSite', e.target.value)}
              className="uber-input w-full"
              placeholder="Gate 2, north parking, lobby…"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="uber-label">What happened?</span>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className="uber-input w-full min-h-[88px] resize-y"
            placeholder="Describe the incident in full detail…"
            required
          />
        </label>

        <label className="block space-y-1">
          <span className="uber-label">Who was involved?</span>
          <textarea
            value={form.partiesInvolved}
            onChange={(e) => update('partiesInvolved', e.target.value)}
            className="uber-input w-full min-h-[64px] resize-y"
            placeholder="Names, descriptions, roles (visitor, employee, unknown subject)…"
          />
        </label>

        <label className="block space-y-1">
          <span className="uber-label">Witnesses</span>
          <textarea
            value={form.witnesses}
            onChange={(e) => update('witnesses', e.target.value)}
            className="uber-input w-full min-h-[56px] resize-y"
            placeholder="Anyone who saw the incident…"
          />
        </label>

        <label className="block space-y-1">
          <span className="uber-label">Why / contributing factors</span>
          <textarea
            value={form.causeOrTrigger}
            onChange={(e) => update('causeOrTrigger', e.target.value)}
            className="uber-input w-full min-h-[56px] resize-y"
            placeholder="What led to or triggered the incident…"
          />
        </label>

        <label className="block space-y-1">
          <span className="uber-label">How did you respond?</span>
          <textarea
            value={form.actionsTaken}
            onChange={(e) => update('actionsTaken', e.target.value)}
            className="uber-input w-full min-h-[64px] resize-y"
            placeholder="Actions taken, escalation, de-escalation, notifications…"
            required
          />
        </label>

        <div className="space-y-2 rounded-xl border border-brand-border p-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.authoritiesNotified}
              onChange={(e) => update('authoritiesNotified', e.target.checked)}
              className="rounded"
            />
            Law enforcement / EMS notified
          </label>
          {form.authoritiesNotified && (
            <input
              type="text"
              value={form.authorityDetails}
              onChange={(e) => update('authorityDetails', e.target.value)}
              className="uber-input w-full"
              placeholder="Agency, officer name, case / incident number…"
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2 rounded-xl border border-brand-border p-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.injuryInvolved}
                onChange={(e) => update('injuryInvolved', e.target.checked)}
                className="rounded"
              />
              Injury involved
            </label>
            {form.injuryInvolved && (
              <textarea
                value={form.injuryDetails}
                onChange={(e) => update('injuryDetails', e.target.value)}
                className="uber-input w-full min-h-[56px] resize-y"
                placeholder="Injury details…"
              />
            )}
          </div>
          <div className="space-y-2 rounded-xl border border-brand-border p-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.propertyDamageInvolved}
                onChange={(e) => update('propertyDamageInvolved', e.target.checked)}
                className="rounded"
              />
              Property damage
            </label>
            {form.propertyDamageInvolved && (
              <textarea
                value={form.propertyDamageDetails}
                onChange={(e) => update('propertyDamageDetails', e.target.value)}
                className="uber-input w-full min-h-[56px] resize-y"
                placeholder="Damage description…"
              />
            )}
          </div>
        </div>

        <label className="block space-y-1">
          <span className="uber-label">Evidence notes</span>
          <textarea
            value={form.evidenceNotes}
            onChange={(e) => update('evidenceNotes', e.target.value)}
            className="uber-input w-full min-h-[56px] resize-y"
            placeholder="Photos taken, CCTV cameras, items secured…"
          />
        </label>

        <div className="space-y-2 rounded-xl border border-brand-border p-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.followUpRequired}
              onChange={(e) => update('followUpRequired', e.target.checked)}
              className="rounded"
            />
            Follow-up required
          </label>
          {form.followUpRequired && (
            <textarea
              value={form.followUpNotes}
              onChange={(e) => update('followUpNotes', e.target.value)}
              className="uber-input w-full min-h-[56px] resize-y"
              placeholder="What follow-up is needed…"
            />
          )}
        </div>

        <div className="uber-overlay-actions pt-1">
          <GuardrButton kind="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </GuardrButton>
          <GuardrButton
            kind="primary"
            type="submit"
            disabled={!form.description.trim() || !form.actionsTaken.trim() || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit report'}
          </GuardrButton>
        </div>
      </form>
    </AppModal>
  );
}
