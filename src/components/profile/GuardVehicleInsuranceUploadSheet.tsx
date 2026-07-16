import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { GuardVehicleInsurancePolicy, SecurityGuard } from '../../types';
import { DocumentPhotoUploadField } from '../credentials/DocumentPhotoUploadField';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { showAppToast } from '../ui/AppToast';

interface GuardVehicleInsuranceUploadSheetProps {
  guard: SecurityGuard;
  open: boolean;
  onClose: () => void;
  onSave: (policy: Partial<GuardVehicleInsurancePolicy> & { guardId: string }) => Promise<void>;
  title?: string;
}

export function GuardVehicleInsuranceUploadSheet({
  guard,
  open,
  onClose,
  onSave,
  title = 'Add vehicle insurance',
}: GuardVehicleInsuranceUploadSheetProps) {
  const policy = guard.vehicleInsurancePolicy;
  const [carrier, setCarrier] = useState(policy?.carrier ?? '');
  const [policyNumber, setPolicyNumber] = useState(policy?.policyNumber ?? '');
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
      setFormError('Upload your vehicle insurance document.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        guardId: guard.id,
        carrier: carrier.trim(),
        policyNumber: policyNumber.trim(),
        effectiveDate: effectiveDate || undefined,
        expiryDate,
        documentUrl,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        rejectionReason: undefined,
      });
      showAppToast('Vehicle insurance submitted for review.', { tone: 'success' });
      onClose();
    } catch {
      setFormError('Could not save vehicle insurance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppFormSheet
      open={open}
      onClose={onClose}
      title={title}
      subtitle="Auto insurance for patrol and driving work"
      ariaLabel="Vehicle insurance"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="uber-label">Insurance carrier</label>
        <input className="uber-input w-full" value={carrier} onChange={(e) => setCarrier(e.target.value)} required />
        <label className="uber-label">Policy number</label>
        <input className="uber-input w-full" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} required />
        <label className="uber-label">Effective date</label>
        <input type="date" className="uber-input w-full" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
        <label className="uber-label">Expiry date</label>
        <input type="date" className="uber-input w-full" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
        <DocumentPhotoUploadField label="Insurance document" imageUrl={documentUrl} onImageUrlChange={setDocumentUrl} />
        {formError ? <p className="text-xs text-red-500">{formError}</p> : null}
        <button type="submit" disabled={saving} className="app-button-primary w-full gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? 'Saving…' : 'Submit for review'}
        </button>
      </form>
    </AppFormSheet>
  );
}
