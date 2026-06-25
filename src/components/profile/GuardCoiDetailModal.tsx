import React, { useEffect, useState } from 'react';
import { FileText, Loader2, Pencil, ShieldCheck, X } from 'lucide-react';
import type { GuardInsurancePolicy, SecurityGuard } from '../../types';
import { resolveInsuranceStatus } from '../../lib/guardInsurance';
import { DocumentPhotoUploadField } from '../credentials/DocumentPhotoUploadField';
import { CoiCredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { AppOverlaySheet } from '../ui/motion/AppMotion';
import { showAppToast } from '../ui/AppToast';

interface GuardCoiDetailModalProps {
  guard: SecurityGuard;
  onClose: () => void;
  canEdit?: boolean;
  staffMode?: boolean;
  initialEditMode?: boolean;
  onSave?: (policy: Partial<GuardInsurancePolicy> & { guardId: string }) => Promise<void>;
  onReview?: (status: 'verified' | 'rejected', rejectionReason?: string) => Promise<void>;
}

export function GuardCoiDetailModal({
  guard,
  onClose,
  canEdit = false,
  staffMode = false,
  initialEditMode = false,
  onSave,
  onReview,
}: GuardCoiDetailModalProps) {
  const policy = guard.insurancePolicy;
  const status = policy ? resolveInsuranceStatus(policy) : 'not_submitted';
  const [editing, setEditing] = useState(initialEditMode && canEdit && !!onSave);
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

  useEffect(() => {
    if (editing) return;
    setCarrier(policy?.carrier ?? '');
    setPolicyNumber(policy?.policyNumber ?? '');
    setGeneralLiabilityLimit(
      policy?.generalLiabilityLimit != null ? String(policy.generalLiabilityLimit) : ''
    );
    setEffectiveDate(policy?.effectiveDate ?? '');
    setExpiryDate(policy?.expiryDate ?? '');
    setDocumentUrl(policy?.documentUrl ?? '');
    setRejectionReason('');
    if (!initialEditMode) setEditing(false);
  }, [guard.id, policy, initialEditMode, editing]);

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
      setEditing(false);
      onClose();
    } catch {
      showAppToast('Could not save insurance certificate.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const docIsImage = documentUrl && /\.(jpe?g|png|gif|webp)(\?|$)/i.test(documentUrl);

  return (
    <AppOverlaySheet open onClose={onClose} ariaLabel="Certificate of Insurance" panelClassName="rounded-t-2xl">
      <div className="space-y-4 px-1">
        <h2 className="text-lg font-bold tracking-tight pr-8">Certificate of Insurance (COI)</h2>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <ShieldCheck className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
            <p className="text-sm text-brand-text-muted leading-relaxed">
              General liability insurance required for marketplace jobs. Staff verifies your COI for
              platform eligibility only.
            </p>
          </div>
          <CoiCredentialStatusBadges guard={guard} />
        </div>

        {policy?.rejectionReason && status === 'rejected' && (
          <p className="text-xs text-red-400 border border-red-500/30 bg-red-500/10 px-3 py-2 rounded-lg">
            {policy.rejectionReason}
          </p>
        )}

        {editing ? (
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
              imageUrl={documentUrl || undefined}
              onImageUrlChange={setDocumentUrl}
              previewAlt="COI document preview"
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="app-button-primary flex-1"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit for review'}
              </button>
              <button type="button" className="app-button-outline" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm space-y-1">
              {policy?.carrier && <p>Carrier: {policy.carrier}</p>}
              {policy?.policyNumber && <p>Policy: {policy.policyNumber}</p>}
              {policy?.expiryDate && <p>Expires: {policy.expiryDate}</p>}
              {!policy?.carrier && <p className="text-brand-text-muted">No insurance certificate on file.</p>}
            </div>
            {documentUrl && (
              <div className="rounded-xl border border-brand-border overflow-hidden">
                {docIsImage ? (
                  <img src={documentUrl} alt="Certificate of Insurance" className="w-full max-h-64 object-contain bg-black/5" />
                ) : (
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-brand-primary"
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    View COI document
                  </a>
                )}
              </div>
            )}
            {canEdit && onSave && (
              <button
                type="button"
                className="app-button-outline gap-2"
                onClick={() => setEditing(true)}
              >
                <Pencil className="w-4 h-4" />
                {policy?.documentUrl ? 'Update COI' : 'Upload COI'}
              </button>
            )}
          </>
        )}

        {staffMode && onReview && policy && status === 'pending' && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-border">
            <button type="button" className="app-button-primary" onClick={() => onReview('verified')}>
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
              onClick={() =>
                onReview('rejected', rejectionReason.trim() || 'Document incomplete or expired')
              }
            >
              Reject
            </button>
          </div>
        )}

        <button type="button" onClick={onClose} className="app-button-outline w-full gap-2">
          <X className="w-4 h-4" />
          Close
        </button>
      </div>
    </AppOverlaySheet>
  );
}
