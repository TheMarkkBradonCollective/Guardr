import React, { useEffect, useMemo, useState } from 'react';
import { Certification, SecurityGuard } from '../../types';
import { getCertCatalogEntry, resolveCertCatalogId } from '../../lib/certCatalog';
import {
  countPtaUofSlotStatuses,
  formatCredentialSlotStatusSummary,
} from '../../lib/certStatus';
import { getAggregateSectionStatus } from '../../lib/credentialSectionStatus';
import { CertItemCard } from '../credentials/CertItemCard';
import { DocumentPhotoUploadField } from '../credentials/DocumentPhotoUploadField';
import {
  BSIS_PTA_UOF_COMBINED_ID,
  BSIS_WMD_AWARENESS_ID,
  LEGACY_PTA_ID,
  LEGACY_UOF_ID,
  PTA_UOF_SEPARATE_PART_COUNT,
  PTA_UOF_UPLOAD_GUIDANCE,
  computePtaUofProgress,
  guardMeetsPtaUofTrainingVerified,
} from '../../lib/guardQualification';
import { BookOpen } from 'lucide-react';
import { CredentialPathToggle, type CredentialUploadPath } from '../credentials/CredentialPathToggle';
import {
  CredentialRowAction,
  CredentialRowHeader,
  CredentialSectionStatusDisplay,
} from '../credentials/CredentialStatusLabels';
import { CredentialGracePeriodStatusBar } from '../credentials/CredentialGracePeriodStatusBar';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import { getCourseUploadStatus } from '../../lib/certStatus';
import { guardCertificationCanEdit, validateCertDeletion, validateCertSubmission } from '../../lib/certImagePolicy';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import type { CertUpdatePayload, CertUpdateResult } from '../credentials/CertDetailModal';
import { canUploadGuardCredentials } from '../../lib/guardCredentialUpload';
import { showAppToast } from '../ui/AppToast';
import { showAppConfirm } from '../ui/AppConfirm';
import { AppFormSheet } from '../ui/app/AppFormSheet';

interface GuardPtaUofPanelProps {
  guard: SecurityGuard;
  editing: boolean;
  staffMode?: boolean;
  onAddCertification?: (cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onDeleteCertification?: (certId: string) => Promise<CertImageMutationResult>;
  onAttachCertificationImage?: (certId: string, imageUrl: string) => Promise<CertImageMutationResult>;
  onUpdateCertification?: (certId: string, payload: CertUpdatePayload) => Promise<CertUpdateResult>;
  renderCertActions?: (cert: Certification) => React.ReactNode;
  /** Activation gate — open upload sheet only (no credential preview list). */
  activationFormOnly?: { open: boolean; onClose: () => void; catalogId?: string };
}

function certsForCatalogId(guard: SecurityGuard, catalogId: string): Certification[] {
  return guard.certifications.filter((cert) => {
    if (cert.status === 'rejected') return false;
    return resolveCertCatalogId(cert) === catalogId;
  });
}

function certsForSecondPart(guard: SecurityGuard): Certification[] {
  return guard.certifications.filter((cert) => {
    if (cert.status === 'rejected') return false;
    const id = resolveCertCatalogId(cert);
    return id === LEGACY_UOF_ID || id === BSIS_WMD_AWARENESS_ID;
  });
}

function defaultPtaUofUploadPath(guard: SecurityGuard): CredentialUploadPath {
  return certsForCatalogId(guard, BSIS_PTA_UOF_COMBINED_ID).length > 0 ? 'combined' : 'individual';
}

export function GuardPtaUofPanel({
  guard,
  editing,
  staffMode = false,
  onAddCertification,
  onDeleteCertification,
  onAttachCertificationImage,
  onUpdateCertification,
  renderCertActions,
  activationFormOnly,
}: GuardPtaUofPanelProps) {
  const progress = computePtaUofProgress(guard);
  const canUpload = canUploadGuardCredentials(editing, staffMode, onAddCertification);
  const combinedEntry = getCertCatalogEntry(BSIS_PTA_UOF_COMBINED_ID);
  const ptaEntry = getCertCatalogEntry(LEGACY_PTA_ID);
  const uofEntry = getCertCatalogEntry(LEGACY_UOF_ID);

  const [addingCatalogId, setAddingCatalogId] = useState<string | null>(null);
  const [issuer, setIssuer] = useState('');
  const [number, setNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [formError, setFormError] = useState('');
  const [uploadPath, setUploadPath] = useState<CredentialUploadPath>(() => defaultPtaUofUploadPath(guard));

  const combinedCerts = useMemo(
    () => certsForCatalogId(guard, BSIS_PTA_UOF_COMBINED_ID),
    [guard]
  );
  const ptaCerts = useMemo(() => certsForCatalogId(guard, LEGACY_PTA_ID), [guard]);
  const secondPartCerts = useMemo(() => certsForSecondPart(guard), [guard]);

  const hasAnyCerts = combinedCerts.length > 0 || ptaCerts.length > 0 || secondPartCerts.length > 0;
  const effectivePath: CredentialUploadPath = hasAnyCerts
    ? (combinedCerts.length > 0 ? 'combined' : 'individual')
    : uploadPath;

  const ptaUofStatusSummary = formatCredentialSlotStatusSummary(countPtaUofSlotStatuses(guard));
  const sectionStatus = getAggregateSectionStatus(
    ptaUofStatusSummary,
    progress.complete,
    guardMeetsPtaUofTrainingVerified(guard)
  );

  const resetForm = () => {
    setAddingCatalogId(null);
    setIssuer('');
    setNumber('');
    setExpiryDate('');
    setImageUrl(undefined);
    setFormError('');
    activationFormOnly?.onClose();
  };

  useEffect(() => {
    if (!activationFormOnly?.open) return;
    const catalogId = activationFormOnly.catalogId ?? ROLLUP_COMPLETION_CATALOG_ID;
    setAddingCatalogId(catalogId);
    setIssuer('');
    setNumber('');
    setExpiryDate('');
    setImageUrl(undefined);
    setFormError('');
  }, [activationFormOnly?.open, activationFormOnly?.catalogId]);

  const startAdd = (catalogId: string) => {
    setAddingCatalogId(catalogId);
    setIssuer('');
    setNumber('');
    setExpiryDate('');
    setImageUrl(undefined);
    setFormError('');
  };

  const submitCert = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!onAddCertification || !addingCatalogId || !issuer.trim() || !number.trim()) return;
    const entry = getCertCatalogEntry(addingCatalogId);
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
    if (!(await showAppConfirm({
      title: 'Remove credential?',
      message: 'Remove this credential from the profile?',
      confirmLabel: 'Remove',
      tone: 'danger',
    }))) return;
    const result = await onDeleteCertification(certId);
    if (result.ok === false) showAppToast(result.error, { tone: 'error' });
  };

  const certCardProps = (cert: Certification) => ({
    onDelete: onDeleteCertification ? () => handleDelete(cert.id) : undefined,
    onAttachImage: onAttachCertificationImage
      ? (imageUrl: string) => onAttachCertificationImage(cert.id, imageUrl)
      : undefined,
    canEdit: staffMode || guardCertificationCanEdit(cert),
    staffMode,
    onUpdate: onUpdateCertification
      ? (payload: CertUpdatePayload) => onUpdateCertification(cert.id, payload)
      : undefined,
    guardName: guard.name,
  });

  const renderCertRow = (cert: Certification) => (
    <div key={cert.id} className="space-y-2">
      <CertItemCard cert={cert} editing={editing} compact showCategory={false} {...certCardProps(cert)} />
      {renderCertActions?.(cert)}
    </div>
  );

  const renderPartRow = ({
    catalogId,
    label,
    subtitle,
    uploaded,
    alternateCatalogId,
    alternateLabel,
  }: {
    catalogId: string;
    label: string;
    subtitle?: string;
    uploaded: Certification[];
    alternateCatalogId?: string;
    alternateLabel?: string;
  }) => (
    <div className="app-list-subrow space-y-2">
      <CredentialRowHeader
        title={label}
        subtitle={subtitle}
        titleMuted={uploaded.length === 0}
        action={
          <CredentialRowAction
            staffMode={staffMode}
            uploadStatus={getCourseUploadStatus(guard, catalogId)}
            canUpload={canUpload}
            onAdd={() => startAdd(catalogId)}
          />
        }
      />

      {uploaded.length > 0 && (
        <div className="app-cert-item-stack !pt-0">
          {uploaded.map((cert) => renderCertRow(cert))}
        </div>
      )}

      {canUpload && !staffMode && alternateCatalogId && uploaded.length === 0 && secondPartCerts.length === 0 && (
        <button
          type="button"
          onClick={() => startAdd(alternateCatalogId)}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-text-muted hover:text-brand-text"
        >
          {alternateLabel ?? 'Upload alternate part 2'}
        </button>
      )}
    </div>
  );

  const uploadSheet = (
    <AppFormSheet
      open={
        (activationFormOnly?.open ?? false) ||
        Boolean(addingCatalogId && (editing || staffMode))
      }
      onClose={resetForm}
      title="Upload PTA/UOF credential"
      subtitle={addingCatalogId ? getCertCatalogEntry(addingCatalogId)?.name : undefined}
    >
      {addingCatalogId && (
        <form onSubmit={submitCert} className="space-y-3">
          <input
            className="uber-input w-full"
            placeholder="Issuing organization (e.g. BSIS, training provider)"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            required
          />
          <input
            className="uber-input w-full"
            placeholder="Certificate number"
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
          />
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={resetForm} className="flex-1 app-button-outline !h-11 !text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!imageUrl?.trim()}
              className="flex-1 app-button-primary !h-11 !text-sm disabled:opacity-50"
            >
              Upload credential
            </button>
          </div>
        </form>
      )}
    </AppFormSheet>
  );

  if (activationFormOnly) {
    return uploadSheet;
  }

  return (
    <section className="app-form-section space-y-4 pb-5 border-b border-brand-border">
      <div>
        <p className="uber-label flex items-center gap-2 flex-wrap">
          <BookOpen className="w-4 h-4" strokeWidth={1.5} />
          Power to Arrest &amp; Appropriate Use of Force
        </p>
        <div className="mt-2 space-y-2">
          <CredentialSectionStatusDisplay status={sectionStatus} />
          <CredentialGracePeriodStatusBar guard={guard} kind="pta-uof" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-end text-xs">
          <span className="text-brand-text-muted">{progress.progressPercent}%</span>
        </div>
        <div className="app-medication-progress">
          <div
            className="app-medication-progress-fill"
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>
      </div>

      {!hasAnyCerts && (
        <CredentialPathToggle
          value={uploadPath}
          onChange={setUploadPath}
          combinedLabel="Combined certificate"
          individualLabel="Individual parts"
        />
      )}

      {effectivePath === 'combined' ? (
        <div className="border-t border-brand-border pt-3 space-y-3">
          <CredentialRowHeader
            rawTitle
            title={
              <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">
                Combined 8-hour certificate
              </span>
            }
            action={
              <CredentialRowAction
                staffMode={staffMode}
                uploadStatus={getCourseUploadStatus(guard, BSIS_PTA_UOF_COMBINED_ID)}
                canUpload={canUpload}
                onAdd={() => startAdd(BSIS_PTA_UOF_COMBINED_ID)}
              />
            }
          />
          {combinedCerts.length > 0 ? (
            <div className="app-cert-item-stack !pt-0">{combinedCerts.map((cert) => renderCertRow(cert))}</div>
          ) : (
            <p className="text-xs text-brand-text-muted py-2">
              {combinedEntry?.description ?? 'Single 8-hour certificate covering both parts.'}
            </p>
          )}
        </div>
      ) : (
        <div className="border-t border-brand-border pt-3 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">
            Individual parts ({PTA_UOF_SEPARATE_PART_COUNT} required)
          </p>
          {renderPartRow({
            catalogId: LEGACY_PTA_ID,
            label: ptaEntry?.name ?? 'Power to Arrest',
            subtitle: ptaEntry?.description,
            uploaded: ptaCerts,
          })}
          {renderPartRow({
            catalogId: LEGACY_UOF_ID,
            label: uofEntry?.name ?? 'Appropriate Use of Force',
            subtitle: 'Or upload Weapons of Mass Destruction Awareness as the second part.',
            uploaded: secondPartCerts,
            alternateCatalogId: BSIS_WMD_AWARENESS_ID,
            alternateLabel: 'Upload WMD Awareness instead',
          })}
        </div>
      )}

      {uploadSheet}
    </section>
  );
}
