import React, { useMemo, useState } from 'react';
import { Certification, SecurityGuard } from '../../types';
import { getCertCatalogEntry, resolveCertCatalogId } from '../../lib/certCatalog';
import {
  countThirtyTwoHourCourseSlotStatuses,
  formatCredentialSlotStatusSummary,
} from '../../lib/certStatus';
import { getAggregateSectionStatus } from '../../lib/credentialSectionStatus';
import { CertItemCard } from '../credentials/CertItemCard';
import { DocumentPhotoUploadField } from '../credentials/DocumentPhotoUploadField';
import {
  getQualificationProgress,
  getThirtyTwoHourCourseCatalogEntries,
  THIRTY_TWO_HOUR_COURSE_IDS,
  THIRTY_TWO_HOUR_ROLLUP_IDS,
} from '../../lib/guardQualification';
import { BookOpen } from 'lucide-react';
import { CredentialPathToggle, type CredentialUploadPath } from '../credentials/CredentialPathToggle';
import {
  CredentialRowAction,
  CredentialRowHeader,
  CredentialSectionStatusDisplay,
} from '../credentials/CredentialStatusLabels';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import { getCourseUploadStatus } from '../../lib/certStatus';
import { guardCertificationCanEdit, validateCertDeletion, validateCertSubmission } from '../../lib/certImagePolicy';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import type { CertUpdatePayload, CertUpdateResult } from '../credentials/CertDetailModal';
import { canUploadGuardCredentials } from '../../lib/guardCredentialUpload';
import { showAppToast } from '../ui/AppToast';
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
}: GuardThirtyTwoHourPanelProps) {
  const progress = getQualificationProgress(guard);
  const courses = getThirtyTwoHourCourseCatalogEntries();
  const canUpload = canUploadGuardCredentials(editing, staffMode, onAddCertification);

  const [addingCatalogId, setAddingCatalogId] = useState<string | null>(null);
  const [issuer, setIssuer] = useState('');
  const [number, setNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [formError, setFormError] = useState('');
  const [uploadPath, setUploadPath] = useState<CredentialUploadPath>(() =>
    defaultThirtyTwoHourUploadPath(guard)
  );

  const rollupCerts = useMemo(() => rollupCertsForGuard(guard), [guard.certifications]);

  const progressPct = progress.thirtyTwoHourProgressPercent;
  const courseStatusSummary = formatCredentialSlotStatusSummary(
    countThirtyTwoHourCourseSlotStatuses(guard)
  );
  const sectionStatus = getAggregateSectionStatus(
    courseStatusSummary,
    progress.thirtyTwoHourBlockComplete
  );

  const resetForm = () => {
    setAddingCatalogId(null);
    setIssuer('');
    setNumber('');
    setExpiryDate('');
    setImageUrl(undefined);
    setFormError('');
  };

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
    if (!window.confirm('Remove this credential from your profile?')) return;
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

  const rollupEntry = getCertCatalogEntry(ROLLUP_COMPLETION_CATALOG_ID);

  return (
    <section className="app-form-section space-y-4">
      <div>
        <p className="uber-label flex items-center gap-2 flex-wrap">
          <BookOpen className="w-4 h-4" strokeWidth={1.5} />
          32-Hour BSIS Course Block
        </p>
        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
          Required to work field jobs. Upload all 9 individual course certificates, or a single 32-hour completion
          certificate if your training provider issued one.
        </p>
        <div className="mt-2">
          <CredentialSectionStatusDisplay status={sectionStatus} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-end text-xs">
          <span className="text-brand-text-muted">{progressPct}%</span>
        </div>
        <div className="app-medication-progress">
          <div className="app-medication-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <CredentialPathToggle
        value={uploadPath}
        onChange={setUploadPath}
        combinedLabel="Completion certificate"
        individualLabel="Individual courses"
      />

      {uploadPath === 'combined' ? (
        <div className="border-t border-brand-border pt-3 space-y-3">
          <CredentialRowHeader
            rawTitle
            title={
              <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">
                32-hour completion certificate
              </span>
            }
            action={
              <CredentialRowAction
                staffMode={staffMode}
                uploadStatus={getCourseUploadStatus(guard, ROLLUP_COMPLETION_CATALOG_ID)}
                canUpload={canUpload}
                onAdd={() => startAdd(ROLLUP_COMPLETION_CATALOG_ID)}
              />
            }
          />
          {rollupCerts.length > 0 ? (
            <div className="app-cert-item-stack !pt-0">
              {rollupCerts.map((cert) => renderCertRow(cert))}
            </div>
          ) : (
            <p className="text-xs text-brand-text-muted py-2">
              {rollupEntry?.description ??
                'Single completion certificate covering all 9 mandatory BSIS courses.'}
            </p>
          )}
        </div>
      ) : (
        <div className="border-t border-brand-border pt-3 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">
            Individual courses ({THIRTY_TWO_HOUR_COURSE_IDS.length} required)
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

      <AppFormSheet
        open={Boolean(addingCatalogId && (editing || staffMode))}
        onClose={resetForm}
        title="Add course certificate"
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
                Add
              </button>
            </div>
          </form>
        )}
      </AppFormSheet>
    </section>
  );
}
