import React, { useEffect, useState } from 'react';
import { Loader2, Pencil, X } from 'lucide-react';
import type { GuardInsurancePolicy, SecurityGuard } from '../../types';
import { CERT_CATEGORY_LABELS } from '../../lib/certCatalog';
import { coiViewSectionLabel } from '../../lib/guardCredentialSections';
import { resolveInsuranceStatus } from '../../lib/guardInsurance';
import { CoiCredentialBadge } from '../credentials/CoiCredentialBadge';
import { CertPhotoRow } from '../credentials/CertPhotoRow';
import { CoiCredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { AppOverlaySheet } from '../ui/motion/AppMotion';
import { showAppToast } from '../ui/AppToast';

interface GuardCoiDetailModalProps {
  guard: SecurityGuard;
  onClose: () => void;
  guardName?: string;
  canEdit?: boolean;
  staffMode?: boolean;
  initialEditMode?: boolean;
  onSave?: (policy: Partial<GuardInsurancePolicy> & { guardId: string }) => Promise<void>;
  onReview?: (status: 'verified' | 'rejected', rejectionReason?: string) => Promise<void>;
}

function formatDisplayDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function GuardCoiDetailModal({
  guard,
  onClose,
  guardName,
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
  const [submitError, setSubmitError] = useState('');

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
    setSubmitError('');
    if (!initialEditMode) setEditing(false);
  }, [guard.id, policy, initialEditMode, editing]);

  const handleSave = async () => {
    if (!onSave) return;
    if (!carrier.trim() || !policyNumber.trim() || !expiryDate) {
      setSubmitError('Carrier, policy number, and expiry date are required.');
      return;
    }
    if (!documentUrl) {
      setSubmitError('Upload your Certificate of Insurance document.');
      return;
    }
    setSaving(true);
    setSubmitError('');
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
      showAppToast('Insurance certificate submitted for review.', { tone: 'success' });
      setEditing(false);
      onClose();
    } catch {
      setSubmitError('Could not save insurance certificate.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setCarrier(policy?.carrier ?? '');
    setPolicyNumber(policy?.policyNumber ?? '');
    setGeneralLiabilityLimit(
      policy?.generalLiabilityLimit != null ? String(policy.generalLiabilityLimit) : ''
    );
    setEffectiveDate(policy?.effectiveDate ?? '');
    setExpiryDate(policy?.expiryDate ?? '');
    setDocumentUrl(policy?.documentUrl ?? '');
    setSubmitError('');
    setEditing(false);
  };

  const sectionLabel = coiViewSectionLabel();
  const categoryLabel = CERT_CATEGORY_LABELS.industry;
  const title = policy?.carrier?.trim() || sectionLabel;
  const displayDocumentUrl = documentUrl.trim() || policy?.documentUrl?.trim() || '';

  return (
    <AppOverlaySheet open onClose={onClose} ariaLabel={title} panelClassName="rounded-t-2xl">
      <div className="flex flex-col max-h-[85dvh]">
        <div className="shrink-0 flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-brand-border">
          <div className="min-w-0">
            {(guardName || guard.name) && (
              <p className="text-xs text-brand-text-muted mb-1">{guardName || guard.name}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <CoiCredentialBadge />
              {sectionLabel !== categoryLabel && (
                <span className="text-[10px] font-medium uppercase tracking-wide text-brand-text-muted">
                  {categoryLabel}
                </span>
              )}
            </div>
            <h2 id="coi-detail-title" className="font-bold text-lg leading-snug">
              {editing ? `Edit ${title}` : title}
            </h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {canEdit && onSave && !editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="app-button-outline !w-auto !h-9 !px-3 !text-xs gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-brand-text-muted hover:text-brand-text hover:bg-brand-border/20"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 pb-8 space-y-5">
          <div className="flex flex-wrap gap-2">
            <CoiCredentialStatusBadges guard={guard} />
          </div>

          {policy?.rejectionReason && status === 'rejected' && (
            <p className="text-sm text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2 leading-relaxed">
              {policy.rejectionReason}
            </p>
          )}

          {editing ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="uber-label">Insurance carrier</label>
                <input
                  className="uber-input w-full"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="Carrier name"
                  required
                />
                <label className="uber-label">Policy number</label>
                <input
                  className="uber-input w-full"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  placeholder="Policy #"
                  required
                />
                <label className="uber-label">General liability limit (USD)</label>
                <input
                  className="uber-input w-full"
                  type="number"
                  min={0}
                  value={generalLiabilityLimit}
                  onChange={(e) => setGeneralLiabilityLimit(e.target.value)}
                  placeholder="1000000"
                />
                <label className="uber-label">Effective date</label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="uber-input w-full"
                />
                <label className="uber-label">Expiry date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="uber-input w-full"
                  required
                />
              </div>
              <div className="space-y-2">
                <p className="uber-label">Document photo (required)</p>
                <CertPhotoRow
                  label="Certificate of Insurance"
                  currentUrl={documentUrl || undefined}
                  locked={false}
                  onSelect={setDocumentUrl}
                />
              </div>
              {submitError && <p className="text-xs text-red-500">{submitError}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  className="app-button-primary !w-auto !h-10 !px-5 !text-sm gap-2 disabled:opacity-50"
                  disabled={saving}
                  onClick={handleSave}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? 'Saving…' : staffMode ? 'Save credential' : 'Submit for review'}
                </button>
                <button
                  type="button"
                  className="app-button-outline !w-auto !h-10 !px-4 !text-sm"
                  disabled={saving}
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {displayDocumentUrl ? (
                <img
                  src={displayDocumentUrl}
                  alt={`${title} document`}
                  className="w-full max-h-[min(52vh,28rem)] object-contain rounded-xl border border-brand-border bg-brand-bg-sec"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-12 rounded-xl border border-dashed border-brand-border bg-brand-bg-sec text-brand-text-muted">
                  <p className="text-sm">No photo uploaded for this credential</p>
                </div>
              )}

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-brand-text-muted">Category</dt>
                  <dd className="font-medium mt-0.5">{sectionLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs text-brand-text-muted">Credential group</dt>
                  <dd className="font-medium mt-0.5">{categoryLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs text-brand-text-muted">Issuing organization</dt>
                  <dd className="font-medium mt-0.5">{policy?.carrier?.trim() || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-brand-text-muted">License / cert number</dt>
                  <dd className="font-medium mt-0.5 font-mono text-[0.8125rem]">
                    {policy?.policyNumber?.trim() || '—'}
                  </dd>
                </div>
                {policy?.generalLiabilityLimit != null && (
                  <div>
                    <dt className="text-xs text-brand-text-muted">General liability limit</dt>
                    <dd className="font-medium mt-0.5">
                      ${policy.generalLiabilityLimit.toLocaleString()}
                    </dd>
                  </div>
                )}
                {policy?.effectiveDate && (
                  <div>
                    <dt className="text-xs text-brand-text-muted">Effective date</dt>
                    <dd className="font-medium mt-0.5">{formatDisplayDate(policy.effectiveDate)}</dd>
                  </div>
                )}
                {policy?.expiryDate && (
                  <div>
                    <dt className="text-xs text-brand-text-muted">Expiration date</dt>
                    <dd className="font-medium mt-0.5">{formatDisplayDate(policy.expiryDate)}</dd>
                  </div>
                )}
              </dl>
            </>
          )}

          {staffMode && onReview && policy && status === 'pending' && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-border">
              <button type="button" className="app-button-primary" onClick={() => onReview('verified')}>
                Verify insurance
              </button>
              <input
                className="uber-input flex-1 min-w-[12rem]"
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
        </div>
      </div>
    </AppOverlaySheet>
  );
}
