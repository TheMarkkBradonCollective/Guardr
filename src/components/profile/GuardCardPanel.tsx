import React, { useMemo, useState } from 'react';
import { Certification, SecurityGuard } from '../../types';
import { getCertCatalogEntry, getCertsByCategory } from '../../lib/certCatalog';
import { getGuardActivationChecklist } from '../../lib/guardAccountActivation';
import { getGuardLicenses } from '../../lib/guardResume';
import { US_STATES } from '../../lib/states';
import type { CertUpdatePayload, CertUpdateResult } from '../credentials/CertDetailModal';
import { CertItemCard } from '../credentials/CertItemCard';
import { WfBadge } from '../ui/wireframe';
import { ImagePlus, Shield } from 'lucide-react';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import { CERT_DOCUMENT_PHOTO_LABEL, CERT_IMAGE_POLICY_HINT, guardCertificationCanEdit, validateCertDeletion, validateCertSubmission } from '../../lib/certImagePolicy';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import { showAppToast } from '../ui/AppToast';

interface GuardCardPanelProps {
  guard: SecurityGuard;
  editing: boolean;
  onAddCertification?: (cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onDeleteCertification?: (certId: string) => Promise<CertImageMutationResult>;
  onAttachCertificationImage?: (certId: string, imageUrl: string) => Promise<CertImageMutationResult>;
  onUpdateCertification?: (certId: string, payload: CertUpdatePayload) => Promise<CertUpdateResult>;
  /** Staff viewing a guard profile — enables credential edit in the detail modal. */
  staffMode?: boolean;
  /** Render inside the credentials stack without a separate section header. */
  nested?: boolean;
  renderCertActions?: (cert: Certification) => React.ReactNode;
}

export function GuardCardPanel({
  guard,
  editing,
  onAddCertification,
  onDeleteCertification,
  onAttachCertificationImage,
  onUpdateCertification,
  staffMode = false,
  nested = false,
  renderCertActions,
}: GuardCardPanelProps) {
  const items = useMemo(() => getGuardLicenses(guard), [guard]);
  const checklist = useMemo(() => getGuardActivationChecklist(guard), [guard]);
  const catalogOptions = useMemo(() => getCertsByCategory('guard-card'), []);

  const [showForm, setShowForm] = useState(false);
  const [issuer, setIssuer] = useState('');
  const [number, setNumber] = useState('');
  const [state, setState] = useState('CA');
  const [expiryDate, setExpiryDate] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setIssuer('');
    setNumber('');
    setState('CA');
    setExpiryDate('');
    setImageUrl(undefined);
    setFormError('');
    setShowForm(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submitGuardCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!onAddCertification || !issuer.trim() || !number.trim() || !state) return;
    const entry = catalogOptions[0] ?? getCertCatalogEntry('bsis-guard-card');
    if (!entry) return;

    const proof = validateCertSubmission(imageUrl);
    if (!proof.ok) {
      setFormError(proof.error);
      return;
    }

    const result = await onAddCertification({
      catalogId: entry.id,
      category: entry.category,
      name: entry.name,
      issuer: issuer.trim(),
      number: number.trim(),
      state: state.toUpperCase(),
      expiryDate: expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      imageUrl,
    });
    if (result.ok === false) {
      setFormError(result.error);
      return;
    }
    resetForm();
  };

  const handleDelete = async (certId: string) => {
    if (!onDeleteCertification) return;
    const cert = guard.certifications.find((c) => c.id === certId);
    if (cert) {
      const allowed = validateCertDeletion(cert);
      if (allowed.ok === false) {
        showAppToast(allowed.error, { tone: 'error' });
        return;
      }
    }
    if (!window.confirm('Remove this guard card from your profile?')) return;
    const result = await onDeleteCertification(certId);
    if (result.ok === false) showAppToast(result.error, { tone: 'error' });
  };

  const certCardProps = (cert: Certification) => ({
    onDelete: onDeleteCertification ? () => handleDelete(cert.id) : undefined,
    onAttachImage: onAttachCertificationImage
      ? (url: string) => onAttachCertificationImage(cert.id, url)
      : undefined,
    canEdit: staffMode || guardCertificationCanEdit(cert),
    staffMode,
    onUpdate: onUpdateCertification
      ? (payload: CertUpdatePayload) => onUpdateCertification(cert.id, payload)
      : undefined,
    guardName: guard.name,
  });

  const statusTone = checklist.guardCardVerified
    ? 'success'
    : checklist.guardCardSubmitted
      ? 'warning'
      : 'default';
  const statusLabel = checklist.guardCardVerified
    ? 'Verified'
    : checklist.guardCardSubmitted
      ? 'Pending review'
      : 'Not uploaded';

  const uploadForm = showForm && editing && (
    <form onSubmit={submitGuardCard} className="space-y-3 border-t border-brand-border pt-3">
      <select value={state} onChange={(e) => setState(e.target.value)} className="uber-select w-full" required>
        {US_STATES.map(({ code, name }) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
      <input
        className="uber-input w-full"
        placeholder="Issuing organization (e.g. BSIS)"
        value={issuer}
        onChange={(e) => setIssuer(e.target.value)}
        required
      />
      <input
        className="uber-input w-full"
        placeholder="Guard card / registration number"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        required
      />
      <input
        type="date"
        value={expiryDate}
        onChange={(e) => setExpiryDate(e.target.value)}
        className="uber-input w-full"
        aria-label="Expiry date"
      />
      <label className="flex items-center gap-2 text-xs text-brand-text-muted cursor-pointer">
        <ImagePlus className="w-4 h-4 shrink-0" />
        <span>{CERT_DOCUMENT_PHOTO_LABEL}</span>
        <input type="file" accept="image/*" className="sr-only" onChange={handleImageSelect} required />
      </label>
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Guard card preview"
          className="w-full max-h-40 object-contain rounded-lg border border-brand-border"
        />
      )}
      {formError && <p className="text-xs text-red-400">{formError}</p>}
      <button
        type="submit"
        disabled={!imageUrl?.trim()}
        className="w-full app-button-primary !h-11 !text-sm disabled:opacity-50"
      >
        Upload guard card
      </button>
    </form>
  );

  const cardRows = items.map((cert) => (
    <div key={cert.id} className="space-y-2">
      <CertItemCard key={cert.id} cert={cert} editing={editing} showCategory={false} {...certCardProps(cert)} />
      {renderCertActions?.(cert)}
    </div>
  ));

  if (nested) {
    return (
      <>
        {cardRows}
        {editing && onAddCertification && (
          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-xs text-brand-text-muted">
                BSIS Guard Card — required before profile approval. {CERT_IMAGE_POLICY_HINT}
              </p>
              <button
                type="button"
                onClick={() => setShowForm((open) => !open)}
                className="app-button-primary !w-auto !h-8 !px-3 !text-xs shrink-0"
              >
                {showForm ? 'Cancel' : items.length ? 'Add another' : 'Upload'}
              </button>
            </div>
            {uploadForm}
          </div>
        )}
      </>
    );
  }

  return (
    <section className="app-form-section space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="uber-label flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-primary" />
            BSIS Guard Card
          </p>
          <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
            Your state guard license — required to work field jobs. {CERT_IMAGE_POLICY_HINT}
          </p>
          <div className="mt-2">
            <WfBadge tone={statusTone}>{statusLabel}</WfBadge>
          </div>
        </div>
        {editing && onAddCertification && (
          <button
            type="button"
            onClick={() => setShowForm((open) => !open)}
            className="app-button-primary !w-auto !h-8 !px-3 !text-xs shrink-0"
          >
            {showForm ? 'Cancel' : items.length ? 'Add another' : 'Upload'}
          </button>
        )}
      </div>

      {uploadForm}

      {items.length === 0 ? (
        <p className="text-xs text-brand-text-muted py-3 border-t border-brand-border">
          No guard card on file yet.
        </p>
      ) : (
        <div className="app-cert-item-stack border-t border-brand-border">
          {cardRows}
        </div>
      )}
    </section>
  );
}
