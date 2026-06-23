import React, { useMemo, useState } from 'react';
import { Certification, SecurityGuard } from '../../types';
import { getCertCatalogEntry, getCertsByCategory } from '../../lib/certCatalog';
import { getCourseUploadStatus } from '../../lib/certStatus';
import { getGuardActivationChecklist } from '../../lib/guardAccountActivation';
import { getGuardLicenses } from '../../lib/guardResume';
import { guardMeetsLevel1 } from '../../lib/guardQualification';
import { US_STATES } from '../../lib/states';
import type { CertUpdatePayload, CertUpdateResult } from '../credentials/CertDetailModal';
import { CredentialSectionAddButton, CredentialSectionStatusBadge } from '../credentials/CredentialStatusLabels';
import { CertItemCard } from '../credentials/CertItemCard';
import { DocumentPhotoUploadField } from '../credentials/DocumentPhotoUploadField';
import { WfBadge } from '../ui/wireframe';
import { Shield } from 'lucide-react';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import { CERT_IMAGE_POLICY_HINT, guardCertificationCanEdit, validateCertDeletion, validateCertSubmission } from '../../lib/certImagePolicy';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import { canUploadGuardCredentials } from '../../lib/guardCredentialUpload';
import { showAppToast } from '../ui/AppToast';
import { AppFormSheet } from '../ui/app/AppFormSheet';

interface GuardCardPanelProps {
  guard: SecurityGuard;
  editing: boolean;
  onAddCertification?: (cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onDeleteCertification?: (certId: string) => Promise<CertImageMutationResult>;
  onAttachCertificationImage?: (certId: string, imageUrl: string) => Promise<CertImageMutationResult>;
  onUpdateCertification?: (certId: string, payload: CertUpdatePayload) => Promise<CertUpdateResult>;
  staffMode?: boolean;
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
  renderCertActions,
}: GuardCardPanelProps) {
  const items = useMemo(() => getGuardLicenses(guard), [guard]);
  const checklist = useMemo(() => getGuardActivationChecklist(guard), [guard]);
  const catalogOptions = useMemo(() => getCertsByCategory('guard-card'), []);
  const uploadStatus = getCourseUploadStatus(guard, 'bsis-guard-card');
  const canUpload = canUploadGuardCredentials(editing, staffMode, onAddCertification);

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

  const submitGuardCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!onAddCertification || !issuer.trim() || !number.trim() || !state) return;
    const entry = catalogOptions[0] ?? getCertCatalogEntry('bsis-guard-card');
    if (!entry) return;

    const proof = validateCertSubmission(imageUrl);
    if (proof.ok === false) {
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
      : 'Not on file';

  const uploadForm = (
    <form onSubmit={submitGuardCard} className="space-y-3">
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
      <DocumentPhotoUploadField
        imageUrl={imageUrl}
        onImageUrlChange={(url) => {
          setImageUrl(url);
          setFormError('');
        }}
        previewAlt="Guard card preview"
      />
      {formError && <p className="text-xs text-red-400">{formError}</p>}
      <button
        type="submit"
        disabled={!imageUrl?.trim()}
        className="w-full app-button-primary !h-11 !text-sm disabled:opacity-50"
      >
        Add
      </button>
    </form>
  );

  const uploadSheet = (
    <AppFormSheet
      open={showForm && canUpload}
      onClose={resetForm}
      title={items.length ? 'Add another guard card' : 'Add guard card'}
      subtitle={`BSIS Guard Card — required before profile approval. ${CERT_IMAGE_POLICY_HINT}`}
    >
      {uploadForm}
    </AppFormSheet>
  );

  const cardRows = items.map((cert) => (
    <div key={cert.id} className="space-y-2">
      <CertItemCard key={cert.id} cert={cert} editing={editing} showCategory={false} {...certCardProps(cert)} />
      {renderCertActions?.(cert)}
    </div>
  ));

  return (
    <>
      <section className="app-form-section space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="uber-label flex items-center gap-2 flex-wrap">
              <Shield className="w-4 h-4 text-brand-primary" />
              BSIS Guard Card
              {staffMode && !guardMeetsLevel1(guard) &&
                (canUpload ? (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="inline-flex"
                  >
                    <CredentialSectionStatusBadge label="Missing" />
                  </button>
                ) : (
                  <CredentialSectionStatusBadge label="Missing" />
                ))}
            </p>
            <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
              Your state guard license — required to work field jobs. {CERT_IMAGE_POLICY_HINT}
            </p>
            <p
              className={`text-xs font-semibold mt-2 ${
                uploadStatus === 'on-file' ? 'text-brand-primary' : 'text-brand-text-muted'
              }`}
            >
              {uploadStatus === 'missing'
                ? 'Not on file'
                : uploadStatus === 'listed'
                  ? staffMode
                    ? 'Listed — document photo required'
                    : 'Not on file'
                  : uploadStatus === 'expired'
                    ? 'On file · expired'
                    : checklist.guardCardVerified
                      ? 'Verified — on file'
                      : checklist.guardCardSubmitted
                        ? 'Submitted — pending staff review'
                        : 'On file'}
            </p>
            {!staffMode && (
              <div className="mt-2">
                <WfBadge tone={statusTone}>{statusLabel}</WfBadge>
              </div>
            )}
          </div>
          {canUpload && <CredentialSectionAddButton onClick={() => setShowForm(true)} />}
        </div>

        {items.length === 0 ? (
          <div className="border-t border-brand-border py-3">
            <p className="text-xs text-brand-text-muted">No guard card on file yet.</p>
          </div>
        ) : (
          <div className="app-cert-item-stack border-t border-brand-border">
            {cardRows}
          </div>
        )}
      </section>
      {uploadSheet}
    </>
  );
}
