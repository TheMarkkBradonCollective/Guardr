import React, { useMemo, useState } from 'react';
import { Certification, SecurityGuard } from '../../types';
import { getCertCatalogEntry, resolveCertCatalogId } from '../../lib/certCatalog';
import { getThirtyTwoHourSectionStatus } from '../../lib/credentialSectionStatus';
import { CertItemCard } from '../credentials/CertItemCard';
import { DocumentPhotoUploadField } from '../credentials/DocumentPhotoUploadField';
import {
  getThirtyTwoHourCourseCatalogEntries,
  getThirtyTwoHourRollupCatalogEntries,
  isThirtyTwoHourCatalogId,
  THIRTY_TWO_HOUR_COURSE_IDS,
  THIRTY_TWO_HOUR_ROLLUP_IDS,
} from '../../lib/guardQualification';
import { BookOpen, ChevronRight } from 'lucide-react';
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
import { certOverlayProps, type CertOverlayNavigation } from '../credentials/credentialOverlayNavigation';
import { canUploadGuardCredentials } from '../../lib/guardCredentialUpload';
import { showAppToast } from '../ui/AppToast';
import { showAppConfirm } from '../ui/AppConfirm';
import { AppFormSheet } from '../ui/app/AppFormSheet';

const ROLLUP_COMPLETION_CATALOG_ID = 'bsis-32-hour-completed';

interface GuardThirtyTwoHourPanelProps {
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
  certOverlayNav?: CertOverlayNavigation;
}

function certsForCatalogId(guard: SecurityGuard, catalogId: string): Certification[] {
  return guard.certifications.filter((cert) => {
    if (cert.status === 'rejected') return false;
    return resolveCertCatalogId(cert) === catalogId;
  });
}

function rollupCertsForGuard(guard: SecurityGuard): Certification[] {
  return guard.certifications.filter((cert) => {
    if (cert.status === 'rejected') return false;
    const id = resolveCertCatalogId(cert);
    return id && (THIRTY_TWO_HOUR_ROLLUP_IDS as readonly string[]).includes(id);
  });
}

function allThirtyTwoHourCerts(guard: SecurityGuard): Certification[] {
  return guard.certifications.filter((cert) => {
    if (cert.status === 'rejected') return false;
    return isThirtyTwoHourCatalogId(resolveCertCatalogId(cert));
  });
}

function defaultThirtyTwoHourUploadPath(guard: SecurityGuard): CredentialUploadPath {
  return rollupCertsForGuard(guard).length > 0 ? 'combined' : 'individual';
}

export function GuardThirtyTwoHourPanel({
  guard,
  editing,
  staffMode = false,
  onAddCertification,
  onDeleteCertification,
  onAttachCertificationImage,
  onUpdateCertification,
  renderCertActions,
  activationFormOnly,
  certOverlayNav,
}: GuardThirtyTwoHourPanelProps) {
  const courses = getThirtyTwoHourCourseCatalogEntries();
  const canUpload = canUploadGuardCredentials(editing, staffMode, onAddCertification, guard);
  const catalogOptions = useMemo(
    () => [...getThirtyTwoHourRollupCatalogEntries(), ...courses],
    [courses]
  );

  const [addingCatalogId, setAddingCatalogId] = useState<string | null>(null);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [issuer, setIssuer] = useState('');
  const [number, setNumber] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [formError, setFormError] = useState('');
  const [uploadPath, setUploadPath] = useState<CredentialUploadPath>(() =>
    defaultThirtyTwoHourUploadPath(guard)
  );

  const rollupCerts = useMemo(() => rollupCertsForGuard(guard), [guard.certifications]);
  const listedCerts = useMemo(() => allThirtyTwoHourCerts(guard), [guard]);

  const hasIndividualCourseCerts = useMemo(
    () => THIRTY_TWO_HOUR_COURSE_IDS.some((id) => certsForCatalogId(guard, id).length > 0),
    [guard]
  );
  const hasAnyCerts = rollupCerts.length > 0 || hasIndividualCourseCerts;
  const effectivePath: CredentialUploadPath = hasAnyCerts
    ? rollupCerts.length > 0
      ? 'combined'
      : 'individual'
    : uploadPath;

  const sectionStatus = getThirtyTwoHourSectionStatus(guard, staffMode);
  const sectionUploadStatus =
    listedCerts.length > 0
      ? 'on-file'
      : getCourseUploadStatus(guard, ROLLUP_COMPLETION_CATALOG_ID);

  const resetForm = () => {
    setAddingCatalogId(null);
    setShowAddPicker(false);
    setIssuer('');
    setNumber('');
    setImageUrl(undefined);
    setFormError('');
    activationFormOnly?.onClose();
  };

  const startAdd = (catalogId: string) => {
    setAddingCatalogId(catalogId);
    setShowAddPicker(false);
    setIssuer('');
    setNumber('');
    setImageUrl(undefined);
    setFormError('');
  };

  const openAddFlow = () => {
    setShowAddPicker(true);
    setAddingCatalogId(null);
    setIssuer('');
    setNumber('');
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
      message: 'Remove this credential from your profile?',
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
    viewFullLabel: certOverlayNav?.onViewFull ? 'View full in Credentials →' : undefined,
    ...certOverlayProps(certOverlayNav, cert.id),
  });

  const renderCertRow = (cert: Certification) => (
    <div key={cert.id} className="space-y-2">
      <CertItemCard cert={cert} editing={editing} compact showCategory={false} {...certCardProps(cert)} />
      {renderCertActions?.(cert)}
    </div>
  );

  const renderCourseRow = ({
    catalogId,
    label,
    subtitle,
    uploaded,
  }: {
    catalogId: string;
    label: string;
    subtitle?: string;
    uploaded: Certification[];
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
    </div>
  );

  const certUploadForm = addingCatalogId ? (
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
      <DocumentPhotoUploadField
        imageUrl={imageUrl}
        onImageUrlChange={(url) => {
          setImageUrl(url);
          setFormError('');
        }}
      />
      {formError && <p className="text-xs text-red-500">{formError}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setAddingCatalogId(null);
            setShowAddPicker(true);
            setIssuer('');
            setNumber('');
            setImageUrl(undefined);
            setFormError('');
          }}
          className="flex-1 app-button-outline !h-11 !text-sm"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!imageUrl?.trim()}
          className="flex-1 app-button-primary !h-11 !text-sm disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </form>
  ) : null;

  const catalogPicker = (
    <ul className="space-y-2">
      {catalogOptions.map((entry) => (
        <li key={entry.id}>
          <button
            type="button"
            onClick={() => startAdd(entry.id)}
            className="w-full flex items-center gap-3 rounded-xl border border-brand-border bg-brand-surface px-4 py-3 text-left hover:border-brand-primary/40 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-text">{entry.name}</p>
              {entry.description && (
                <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">{entry.description}</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 text-brand-text-muted" />
          </button>
        </li>
      ))}
    </ul>
  );

  if (activationFormOnly) {
    return (
      <AppFormSheet
        open={activationFormOnly.open}
        onClose={resetForm}
        title="Add 32-hour training"
        subtitle={addingCatalogId ? getCertCatalogEntry(addingCatalogId)?.name : undefined}
      >
        {addingCatalogId ? (
          certUploadForm
        ) : (
          <div className="space-y-4">
            <CredentialPathToggle
              value={effectivePath}
              onChange={(path) => {
                if (!hasAnyCerts) setUploadPath(path);
              }}
              combinedLabel="Combined certificate"
              individualLabel="Individual parts"
            />
            {effectivePath === 'combined' ? (
              <button
                type="button"
                onClick={() => startAdd(ROLLUP_COMPLETION_CATALOG_ID)}
                className="app-button-primary !w-full !h-11 !text-sm"
              >
                Upload 32-hour completion certificate
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-brand-text-muted">
                  Upload all {THIRTY_TWO_HOUR_COURSE_IDS.length} individual course certificates.
                </p>
                {courses.map((course) =>
                  renderCourseRow({
                    catalogId: course.id,
                    label: course.name,
                    subtitle: course.description,
                    uploaded: certsForCatalogId(guard, course.id),
                  })
                )}
              </div>
            )}
          </div>
        )}
      </AppFormSheet>
    );
  }

  const rollupEntry = getCertCatalogEntry(ROLLUP_COMPLETION_CATALOG_ID);

  return (
    <section className="app-form-section space-y-3 pb-5 border-b border-brand-border">
      <CredentialRowHeader
        rawTitle
        title={
          <p className="uber-label flex items-center gap-2 flex-wrap">
            <BookOpen className="w-4 h-4 text-brand-primary shrink-0" />
            32-Hour BSIS Course Block
          </p>
        }
        subtitle={
          <div className="mt-2 space-y-2">
            <CredentialSectionStatusDisplay status={sectionStatus} />
            <CredentialGracePeriodStatusBar guard={guard} kind="32-hour" />
          </div>
        }
        action={
          <CredentialRowAction
            staffMode={staffMode}
            uploadStatus={sectionUploadStatus}
            canUpload={canUpload}
            onAdd={openAddFlow}
          />
        }
      />

      {listedCerts.length === 0 ? (
        <div className="border-t border-brand-border py-3">
          <p className="text-xs text-brand-text-muted">
            No 32-hour training on file yet.
            {rollupEntry?.description ? ` ${rollupEntry.description}` : ''}
          </p>
        </div>
      ) : (
        <div className="app-cert-item-stack border-t border-brand-border">
          {listedCerts.map((cert) => renderCertRow(cert))}
        </div>
      )}

      <AppFormSheet
        open={showAddPicker || Boolean(addingCatalogId)}
        onClose={resetForm}
        title="Add 32-hour training"
        subtitle={addingCatalogId ? getCertCatalogEntry(addingCatalogId)?.name : 'Choose which certificate to upload'}
      >
        {addingCatalogId ? certUploadForm : catalogPicker}
      </AppFormSheet>
    </section>
  );
}
