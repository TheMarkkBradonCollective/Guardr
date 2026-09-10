import React, { useMemo, useState } from 'react';
import { Certification, SecurityGuard } from '../../types';
import { getCertCatalogEntry, resolveCertCatalogId } from '../../lib/certCatalog';
import { getThirtyTwoHourSectionStatus } from '../../lib/credentialSectionStatus';
import { CertItemCard } from '../credentials/CertItemCard';
import { DocumentPhotoUploadField } from '../credentials/DocumentPhotoUploadField';
import {
  getThirtyTwoHourCourseCatalogEntries,
  isContinuingEducationCatalogId,
  THIRTY_TWO_HOUR_COURSE_IDS,
} from '../../lib/guardQualification';
import { BookOpen, ChevronRight } from 'lucide-react';
import {
  CredentialRowAction,
  CredentialRowHeader,
} from '../credentials/CredentialStatusLabels';
import { CredentialGracePeriodStatusBar } from '../credentials/CredentialGracePeriodStatusBar';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import { getCourseUploadStatus } from '../../lib/certStatus';
import { guardCertificationCanEdit, validateCertDeletion, validateCertSubmission } from '../../lib/certImagePolicy';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import type { CertUpdatePayload, CertUpdateResult } from '../credentials/CertDetailModal';
import { certOverlayProps, type CertOverlayNavigation } from '../credentials/credentialOverlayNavigation';
import { canUploadGuardCredentials } from '../../lib/guardCredentialUpload';
import { staffCanEditCertification } from '../../lib/staffCredentialRules';
import { showAppToast } from '../ui/AppToast';
import { showAppConfirm } from '../ui/AppConfirm';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { buildCredentialCatalogSlots } from '../../lib/guardCredentialCatalog';
import {
  certsForCatalogId,
  findRejectedCertForCatalog,
  guardHasRejectedCertForCatalog,
} from '../../lib/certResubmit';
import { CredentialCatalogSlotList } from '../credentials/CredentialCatalogSlotList';
import { CertDetailModal } from '../credentials/CertDetailModal';

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

function allContinuingEducationCerts(guard: SecurityGuard): Certification[] {
  return guard.certifications.filter((cert) =>
    isContinuingEducationCatalogId(resolveCertCatalogId(cert))
  );
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
  const catalogOptions = useMemo(() => courses, [courses]);

  const [addingCatalogId, setAddingCatalogId] = useState<string | null>(null);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [issuer, setIssuer] = useState('');
  const [number, setNumber] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const listedCerts = useMemo(() => allContinuingEducationCerts(guard), [guard]);
  const ceSlots = useMemo(
    () => buildCredentialCatalogSlots(guard, [...THIRTY_TWO_HOUR_COURSE_IDS]),
    [guard]
  );

  const sectionStatus = getThirtyTwoHourSectionStatus(guard, staffMode);
  const sectionUploadStatus =
    listedCerts.length > 0
      ? 'on-file'
      : getCourseUploadStatus(guard, THIRTY_TWO_HOUR_COURSE_IDS[0]);

  const resetForm = () => {
    setAddingCatalogId(null);
    setShowAddPicker(false);
    setEditingCertId(null);
    setIssuer('');
    setNumber('');
    setImageUrl(undefined);
    setFormError('');
    activationFormOnly?.onClose();
  };

  const openCertEdit = (cert: Certification) => {
    setAddingCatalogId(null);
    setShowAddPicker(false);
    setEditingCertId(cert.id);
    setFormError('');
  };

  const startAdd = (catalogId: string) => {
    const rejected = findRejectedCertForCatalog(guard, catalogId);
    if (rejected && onUpdateCertification) {
      openCertEdit(rejected);
      return;
    }
    setAddingCatalogId(catalogId);
    setShowAddPicker(false);
    setEditingCertId(null);
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
    if (saving) return;
    setFormError('');
    if (!onAddCertification || !addingCatalogId || !issuer.trim() || !number.trim()) return;
    const entry = getCertCatalogEntry(addingCatalogId);
    if (!entry) return;

    const proof = validateCertSubmission(imageUrl);
    if (proof.ok === false) {
      setFormError(proof.error);
      return;
    }

    setSaving(true);
    try {
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
    } finally {
      setSaving(false);
    }
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
    canEdit: staffMode ? staffCanEditCertification(guard, cert) : guardCertificationCanEdit(cert),
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

  const editingCert = editingCertId
    ? guard.certifications.find((cert) => cert.id === editingCertId)
    : undefined;

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
        action={
          <CredentialRowAction
            staffMode={staffMode}
            uploadStatus={getCourseUploadStatus(guard, catalogId)}
            canUpload={canUpload}
            editMode={guardHasRejectedCertForCatalog(guard, catalogId)}
            onEdit={() => {
              const rejected = findRejectedCertForCatalog(guard, catalogId);
              if (rejected) openCertEdit(rejected);
            }}
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
          disabled={!imageUrl?.trim() || saving}
          className="flex-1 app-button-primary !h-11 !text-sm disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Add'}
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

  const sheetTitle = editingCert ? 'Edit Continued Education' : 'Add Continued Education';

  if (activationFormOnly) {
    return (
      <>
        <AppFormSheet
          open={activationFormOnly.open}
          onClose={resetForm}
          title={sheetTitle}
          subtitle={addingCatalogId ? getCertCatalogEntry(addingCatalogId)?.name : undefined}
        >
          {addingCatalogId ? (
            certUploadForm
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-brand-text-muted">
                Upload all {THIRTY_TWO_HOUR_COURSE_IDS.length} Continued Education course certificates (32-hour BSIS CE package).
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
        </AppFormSheet>
        {editingCert && onUpdateCertification && (
          <CertDetailModal
            cert={editingCert}
            guardName={guard.name}
            canEdit={staffMode ? staffCanEditCertification(guard, editingCert) : guardCertificationCanEdit(editingCert)}
            staffMode={staffMode}
            initialEditMode
            onSubmit={(payload) => onUpdateCertification(editingCert.id, payload)}
            onClose={resetForm}
          />
        )}
      </>
    );
  }

  return (
    <section className="app-form-section space-y-3 pb-5 border-b border-brand-border">
      <CredentialRowHeader
        rawTitle
        title={
          <p className="uber-label flex items-center gap-2 flex-wrap">
            <BookOpen className="w-4 h-4 text-brand-primary shrink-0" />
            Continued Education
          </p>
        }
        subtitle={
          <div className="mt-2">
            <CredentialGracePeriodStatusBar guard={guard} kind="ce" />
          </div>
        }
        action={
          <CredentialRowAction
            staffMode={staffMode}
            uploadStatus={sectionUploadStatus}
            sectionStatus={sectionStatus}
            canUpload={canUpload}
            onAdd={openAddFlow}
          />
        }
      />

      <div className="border-t border-brand-border pt-3">
        <CredentialCatalogSlotList
          guard={guard}
          slots={ceSlots}
          staffMode={staffMode}
          canUpload={canUpload}
          editing={editing}
          compact
          onAdd={startAdd}
          onEditCert={openCertEdit}
          renderCertRow={renderCertRow}
          certCardProps={certCardProps}
        />
      </div>

      <AppFormSheet
        open={showAddPicker || Boolean(addingCatalogId)}
        onClose={resetForm}
        title={sheetTitle}
        subtitle={addingCatalogId ? getCertCatalogEntry(addingCatalogId)?.name : 'Choose which certificate to upload'}
      >
        {addingCatalogId ? certUploadForm : catalogPicker}
      </AppFormSheet>

      {editingCert && onUpdateCertification && (
        <CertDetailModal
          cert={editingCert}
          guardName={guard.name}
          canEdit={staffMode ? staffCanEditCertification(guard, editingCert) : guardCertificationCanEdit(editingCert)}
          staffMode={staffMode}
          initialEditMode
          onSubmit={(payload) => onUpdateCertification(editingCert.id, payload)}
          onClose={() => setEditingCertId(null)}
        />
      )}
    </section>
  );
}
