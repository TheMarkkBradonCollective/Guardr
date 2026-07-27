import React, { useEffect, useMemo, useState } from 'react';
import { Certification, SecurityGuard } from '../../types';
import { getCertCatalogEntry, getCertsByCategory } from '../../lib/certCatalog';
import { getGuardCardSectionStatus } from '../../lib/credentialSectionStatus';
import { getGuardLicenses } from '../../lib/guardResume';
import { US_STATES } from '../../lib/states';
import type { CertUpdatePayload, CertUpdateResult } from '../credentials/CertDetailModal';
import { certOverlayProps, type CertOverlayNavigation } from '../credentials/credentialOverlayNavigation';
import { CredentialRowAction, CredentialRowHeader } from '../credentials/CredentialStatusLabels';
import { CertItemCard } from '../credentials/CertItemCard';
import { DocumentPhotoUploadField } from '../credentials/DocumentPhotoUploadField';
import { Shield } from 'lucide-react';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import { getCourseUploadStatus } from '../../lib/certStatus';
import { CERT_IMAGE_POLICY_HINT, guardCertificationCanEdit, validateCertDeletion, validateCertSubmission } from '../../lib/certImagePolicy';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import { canUploadGuardCredentials } from '../../lib/guardCredentialUpload';
import { staffCanEditCertification } from '../../lib/staffCredentialRules';
import { showAppToast } from '../ui/AppToast';
import { showAppConfirm } from '../ui/AppConfirm';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { findRejectedCertForCatalog, guardHasRejectedCertForCatalog } from '../../lib/certResubmit';
import { CertDetailModal } from '../credentials/CertDetailModal';

interface GuardCardPanelProps {
  guard: SecurityGuard;
  editing: boolean;
  onAddCertification?: (cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onDeleteCertification?: (certId: string) => Promise<CertImageMutationResult>;
  onAttachCertificationImage?: (certId: string, imageUrl: string) => Promise<CertImageMutationResult>;
  onUpdateCertification?: (certId: string, payload: CertUpdatePayload) => Promise<CertUpdateResult>;
  staffMode?: boolean;
  renderCertActions?: (cert: Certification) => React.ReactNode;
  /** Activation gate — open upload sheet only (no credential preview list). */
  activationFormOnly?: { open: boolean; onClose: () => void };
  certOverlayNav?: CertOverlayNavigation;
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
  activationFormOnly,
  certOverlayNav,
}: GuardCardPanelProps) {
  const items = useMemo(() => getGuardLicenses(guard), [guard]);
  const catalogOptions = useMemo(() => getCertsByCategory('guard-card'), []);
  const sectionStatus = useMemo(() => getGuardCardSectionStatus(guard, staffMode), [guard, staffMode]);
  const guardCardUploadStatus = useMemo(() => {
    if (items.length > 0) return 'on-file' as const;
    return getCourseUploadStatus(guard, catalogOptions[0]?.id ?? 'bsis-guard-card');
  }, [guard, catalogOptions, items.length]);
  const canUpload = canUploadGuardCredentials(editing, staffMode, onAddCertification, guard);

  const [showForm, setShowForm] = useState(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [issuer, setIssuer] = useState('');
  const [number, setNumber] = useState('');
  const [state, setState] = useState('CA');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [formError, setFormError] = useState('');

  const rejectedGuardCard = useMemo(
    () => findRejectedCertForCatalog(guard, 'bsis-guard-card'),
    [guard]
  );
  const editingCert = editingCertId
    ? guard.certifications.find((cert) => cert.id === editingCertId)
    : undefined;

  const resetForm = () => {
    setIssuer('');
    setNumber('');
    setState('CA');
    setImageUrl(undefined);
    setFormError('');
    setShowForm(false);
    setEditingCertId(null);
    activationFormOnly?.onClose();
  };

  const openGuardCardUpload = () => {
    if (rejectedGuardCard && onUpdateCertification) {
      setEditingCertId(rejectedGuardCard.id);
      setShowForm(false);
      return;
    }
    setShowForm(true);
  };

  useEffect(() => {
    if (!activationFormOnly?.open) return;
    if (rejectedGuardCard && onUpdateCertification) {
      setEditingCertId(rejectedGuardCard.id);
      setShowForm(false);
      return;
    }
    setShowForm(true);
  }, [activationFormOnly?.open, rejectedGuardCard, onUpdateCertification]);

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
    if (!(await showAppConfirm({
      title: 'Remove guard card?',
      message: 'Remove this guard card from your profile?',
      confirmLabel: 'Remove',
      tone: 'danger',
    }))) return;
    const result = await onDeleteCertification(certId);
    if (result.ok === false) showAppToast(result.error, { tone: 'error' });
  };

  const credentialViewFullLabel = certOverlayNav?.onViewFull ? 'View full in Credentials →' : undefined;

  const certCardProps = (cert: Certification) => ({
    onDelete: onDeleteCertification ? () => handleDelete(cert.id) : undefined,
    onAttachImage: onAttachCertificationImage
      ? (url: string) => onAttachCertificationImage(cert.id, url)
      : undefined,
    canEdit: staffMode ? staffCanEditCertification(guard, cert) : guardCertificationCanEdit(cert),
    staffMode,
    onUpdate: onUpdateCertification
      ? (payload: CertUpdatePayload) => onUpdateCertification(cert.id, payload)
      : undefined,
    guardName: guard.name,
    viewFullLabel: credentialViewFullLabel,
    ...certOverlayProps(certOverlayNav, cert.id),
  });

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
      open={(activationFormOnly?.open ?? false) || (showForm && canUpload)}
      onClose={resetForm}
      title={rejectedGuardCard ? 'Edit guard card' : items.length ? 'Add another guard card' : 'Add guard card'}
      subtitle="BSIS Guard Card"
    >
      {uploadForm}
    </AppFormSheet>
  );

  const editModal =
    editingCert && onUpdateCertification ? (
      <CertDetailModal
        cert={editingCert}
        guardName={guard.name}
        canEdit={staffMode ? staffCanEditCertification(guard, editingCert) : guardCertificationCanEdit(editingCert)}
        staffMode={staffMode}
        initialEditMode
        onSubmit={(payload) => onUpdateCertification(editingCert.id, payload)}
        onClose={resetForm}
      />
    ) : null;

  if (activationFormOnly) {
    return (
      <>
        {!editingCert && uploadSheet}
        {editModal}
      </>
    );
  }

  const cardRows = items.map((cert) => (
    <div key={cert.id} className="space-y-2">
      <CertItemCard key={cert.id} cert={cert} editing={editing} showCategory={false} {...certCardProps(cert)} />
      {renderCertActions?.(cert)}
    </div>
  ));

  return (
    <>
      <section className="app-form-section space-y-3">
        <CredentialRowHeader
          rawTitle
          title={
            <p className="uber-label flex items-center gap-2 flex-wrap">
              <Shield className="w-4 h-4 text-brand-primary shrink-0" />
              BSIS Guard Card
            </p>
          }
          subtitle={undefined}
          action={
            <CredentialRowAction
              staffMode={staffMode}
              uploadStatus={guardCardUploadStatus}
              sectionStatus={sectionStatus}
              canUpload={canUpload}
              editMode={guardHasRejectedCertForCatalog(guard, 'bsis-guard-card')}
              onEdit={() => {
                if (rejectedGuardCard) setEditingCertId(rejectedGuardCard.id);
              }}
              onAdd={openGuardCardUpload}
            />
          }
        />

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
      {editModal}
    </>
  );
}
