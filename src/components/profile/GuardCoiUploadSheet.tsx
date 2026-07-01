import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { GuardInsurancePolicy, SecurityGuard } from '../../types';
import { DocumentPhotoUploadField } from '../credentials/DocumentPhotoUploadField';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { showAppToast } from '../ui/AppToast';

interface GuardCoiUploadSheetProps {
  guard: SecurityGuard;
  open: boolean;
  onClose: () => void;
  onSave: (policy: Partial<GuardInsurancePolicy> & { guardId: string }) => Promise<void>;
  title?: string;
}

export function GuardCoiUploadSheet({
  guard,
  open,
  onClose,
  onSave,
  title = 'Add Certificate of Insurance',
}: GuardCoiUploadSheetProps) {
  const policy = guard.insurancePolicy;
  const [carrier, setCarrier] = useState(policy?.carrier ?? '');
  const [policyNumber, setPolicyNumber] = useState(policy?.policyNumber ?? '');
  const [generalLiabilityLimit, setGeneralLiabilityLimit] = useState(
    policy?.generalLiabilityLimit != null ? String(policy.generalLiabilityLimit) : ''
  );
  const [effectiveDate, setEffectiveDate] = useState(policy?.effectiveDate ?? '');
  const [expiryDate, setExpiryDate] = useState(policy?.expiryDate ?? '');
  const [documentUrl, setDocumentUrl] = useState(policy?.documentUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!carrier.trim() || !policyNumber.trim() || !expiryDate) {
      setFormError('Carrier, policy number, and expiry date are required.');
      return;
    }
    if (!documentUrl) {
      setFormError('Upload your Certificate of Insurance document.');
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
      showAppToast('Insurance certificate submitted for review.', { tone: 'success' });
      onClose();
    } catch {
      setFormError('Could not save insurance certificate.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppFormSheet
      open={open}
      onClose={onClose}
      title={title}
      subtitle="Certificate of Insurance (COI)"
      ariaLabel="Certificate of Insurance"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
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
        <DocumentPhotoUploadField
          label="Certificate of Insurance (COI)"
          imageUrl={documentUrl || undefined}
          onImageUrlChange={setDocumentUrl}
          previewAlt="COI document preview"
        />
        {formError && <p className="text-xs text-red-400">{formError}</p>}
        <button
          type="submit"
          disabled={saving || !documentUrl}
          className="w-full app-button-primary !h-11 !text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit for review'}
        </button>
      </form>
    </AppFormSheet>
  );
}
