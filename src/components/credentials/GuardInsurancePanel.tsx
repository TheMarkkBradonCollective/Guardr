import React, { useState } from 'react';
import { ShieldCheck, Upload } from 'lucide-react';
import type { GuardInsurancePolicy, SecurityGuard } from '../../types';
import {
  INSURANCE_STATUS_LABELS,
  resolveInsuranceStatus,
} from '../../lib/guardInsurance';
import { DocumentPhotoUploadField } from '../credentials/DocumentPhotoUploadField';
import { showAppToast } from '../ui/AppToast';

interface GuardInsurancePanelProps {
  guard: SecurityGuard;
  editing?: boolean;
  staffMode?: boolean;
  onSave?: (policy: Partial<GuardInsurancePolicy> & { guardId: string }) => Promise<void>;
  onReview?: (status: 'verified' | 'rejected', rejectionReason?: string) => Promise<void>;
}

export function GuardInsurancePanel({
  guard,
  editing = false,
  staffMode = false,
  onSave,
  onReview,
}: GuardInsurancePanelProps) {
  const policy = guard.insurancePolicy;
  const status = policy ? resolveInsuranceStatus(policy) : 'not_submitted';
  const [carrier, setCarrier] = useState(policy?.carrier ?? '');
  const [policyNumber, setPolicyNumber] = useState(policy?.policyNumber ?? '');
  const [generalLiabilityLimit, setGeneralLiabilityLimit] = useState(
    policy?.generalLiabilityLimit != null ? String(policy.generalLiabilityLimit) : ''
  );
  const [effectiveDate, setEffectiveDate] = useState(policy?.effectiveDate ?? '');
  const [expiryDate, setExpiryDate] = useState(policy?.expiryDate ?? '');
  const [documentUrl, setDocumentUrl] = useState(policy?.documentUrl ?? '');
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving] = useState(false);

  const canEdit = editing && !staffMode && onSave;
  const canReview = staffMode && onReview && policy && status === 'pending';

  const handleSave = async () => {
    if (!onSave) return;
    if (!carrier.trim() || !policyNumber.trim() || !expiryDate) {
      showAppToast('Carrier, policy number, and expiry date are required.', 'error');
      return;
    }
    if (!documentUrl) {
      showAppToast('Upload your Certificate of Insurance document.', 'error');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        guardId: guard.id,
        carrier: carrier.trim(),
        policyNumber: policyNumber.trim(),
        generalLiabilityLimit: generalLiabilityLimit ? Number(generalLiabilityLimit) : undefined,
        effectiveDate: effectiveDate || undefined,
        expiryDate,
        documentUrl,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        rejectionReason: undefined,
      });
      showAppToast('Insurance certificate submitted for review.', 'success');
    } catch {
      showAppToast('Could not save insurance certificate.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="credential-view-section space-y-3">
      <div className="credential-view-section-header">
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-snug">General liability insurance (COI)</h3>
            <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
              Required for marketplace jobs. Upload your Certificate of Insurance — Guardr reviews for
              platform eligibility only.
            </p>
          </div>
        </div>
        <span className="credential-view-section-count text-xs font-semibold text-brand-text-muted">
          {INSURANCE_STATUS_LABELS[status]}
        </span>
      </div>

      {policy?.rejectionReason && status === 'rejected' && (
        <p className="text-xs text-red-400 border border-red-500/30 bg-red-500/10 px-3 py-2 rounded-lg">
          {policy.rejectionReason}
        </p>
      )}

      {canEdit ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-brand-text-muted">
              Insurance carrier
              <input
                className="app-input mt-1 w-full"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="Carrier name"
              />
            </label>
            <label className="block text-xs font-medium text-brand-text-muted">
              Policy number
              <input
                className="app-input mt-1 w-full"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="Policy #"
              />
            </label>
            <label className="block text-xs font-medium text-brand-text-muted">
              GL limit (USD)
              <input
                className="app-input mt-1 w-full"
                type="number"
                min={0}
                value={generalLiabilityLimit}
                onChange={(e) => setGeneralLiabilityLimit(e.target.value)}
                placeholder="1000000"
              />
            </label>
            <label className="block text-xs font-medium text-brand-text-muted">
              Effective date
              <input
                className="app-input mt-1 w-full"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </label>
            <label className="block text-xs font-medium text-brand-text-muted sm:col-span-2">
              Expiry date
              <input
                className="app-input mt-1 w-full"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </label>
          </div>
          <DocumentPhotoUploadField
            label="Certificate of Insurance (COI)"
            hint="PDF or photo of your general liability certificate"
            imageUrl={documentUrl || undefined}
            onImageUploaded={setDocumentUrl}
            icon={Upload}
          />
          <button type="button" className="app-button-primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Submit for review'}
          </button>
        </div>
      ) : (
        <div className="text-sm text-brand-text-muted space-y-1">
          {policy?.carrier && <p>Carrier: {policy.carrier}</p>}
          {policy?.policyNumber && <p>Policy: {policy.policyNumber}</p>}
          {policy?.expiryDate && <p>Expires: {policy.expiryDate}</p>}
          {!policy?.carrier && <p>No insurance certificate on file.</p>}
        </div>
      )}

      {canReview && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-border">
          <button
            type="button"
            className="app-button-primary"
            onClick={() => onReview('verified')}
          >
            Verify insurance
          </button>
          <input
            className="app-input flex-1 min-w-[12rem]"
            placeholder="Rejection reason (if rejecting)"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <button
            type="button"
            className="app-button-secondary"
            onClick={() => onReview('rejected', rejectionReason.trim() || 'Document incomplete or expired')}
          >
            Reject
          </button>
        </div>
      )}
    </section>
  );
}
