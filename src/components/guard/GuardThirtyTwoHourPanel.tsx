import React, { useMemo, useState } from 'react';
import { Certification, SecurityGuard } from '../../types';
import { getCertCatalogEntry, resolveCertCatalogId } from '../../lib/certCatalog';
import {
  getCourseUploadStatus,
  getCourseUploadStatusBadgeClass,
  getCourseUploadStatusLabel,
  isCertExpired,
} from '../../lib/certStatus';
import { CredentialStatusBadges } from './CredentialStatusBadge';
import {
  getQualificationProgress,
  getThirtyTwoHourCourseCatalogEntries,
  THIRTY_TWO_HOUR_COURSE_IDS,
  THIRTY_TWO_HOUR_ROLLUP_IDS,
} from '../../lib/guardQualification';
import { formatStateName } from '../../lib/states';
import { BookOpen, Check, ImagePlus, Plus, Trash2 } from 'lucide-react';
import type { AddCertificationResult } from '../../lib/certUniqueness';

const ROLLUP_COMPLETION_CATALOG_ID = 'bsis-32-hour-completed';

interface GuardThirtyTwoHourPanelProps {
  guard: SecurityGuard;
  editing: boolean;
  onAddCertification?: (cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onDeleteCertification?: (certId: string) => void | Promise<void>;
}

function certsForCatalogId(guard: SecurityGuard, catalogId: string): Certification[] {
  return guard.certifications.filter((cert) => {
    if (cert.status === 'rejected') return false;
    return resolveCertCatalogId(cert) === catalogId;
  });
}

export function GuardThirtyTwoHourPanel({
  guard,
  editing,
  onAddCertification,
  onDeleteCertification,
}: GuardThirtyTwoHourPanelProps) {
  const progress = getQualificationProgress(guard);
  const courses = getThirtyTwoHourCourseCatalogEntries();

  const [addingCatalogId, setAddingCatalogId] = useState<string | null>(null);
  const [issuer, setIssuer] = useState('');
  const [number, setNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [formError, setFormError] = useState('');

  const rollupCerts = useMemo(
    () =>
      guard.certifications.filter((cert) => {
        if (cert.status === 'rejected') return false;
        const id = resolveCertCatalogId(cert);
        return id && (THIRTY_TWO_HOUR_ROLLUP_IDS as readonly string[]).includes(id);
      }),
    [guard.certifications]
  );

  const progressPct = progress.thirtyTwoHourBlockComplete
    ? 100
    : Math.round((progress.uploaded32HourCount / progress.total32HourCourses) * 100);

  const resetForm = () => {
    setAddingCatalogId(null);
    setIssuer('');
    setNumber('');
    setIssueDate('');
    setExpiryDate('');
    setImageUrl(undefined);
    setFormError('');
  };

  const startAdd = (catalogId: string) => {
    setAddingCatalogId(catalogId);
    setIssuer('');
    setNumber('');
    setIssueDate('');
    setExpiryDate('');
    setImageUrl(undefined);
    setFormError('');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submitCert = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!onAddCertification || !addingCatalogId || !issuer.trim() || !number.trim()) return;
    const entry = getCertCatalogEntry(addingCatalogId);
    if (!entry) return;

    const result = await onAddCertification({
      catalogId: entry.id,
      category: entry.category,
      name: entry.name,
      issuer: issuer.trim(),
      number: number.trim(),
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      expiryDate: expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      imageUrl,
    });
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    resetForm();
  };

  const handleDelete = async (certId: string) => {
    if (!onDeleteCertification) return;
    if (!window.confirm('Remove this credential from your profile?')) return;
    await onDeleteCertification(certId);
  };

  return (
    <section className="app-card space-y-4 border-brand-primary/20">
      <div>
        <p className="uber-label flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-primary" />
          32-Hour BSIS Course Block
        </p>
        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
          Required for Active status. Upload all 9 individual course certificates, or a single 32-hour
          completion certificate if your training provider issued one.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-brand-text">
            {progress.thirtyTwoHourBlockComplete
              ? progress.thirtyTwoHourRollup
                ? '32-hour block complete (rollup cert on file)'
                : '32-hour block complete (all 9 courses on file)'
              : `${progress.uploaded32HourCount} of ${progress.total32HourCourses} courses on file`}
          </span>
          <span className="text-brand-text-muted">{progressPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-brand-border/40 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${progress.thirtyTwoHourBlockComplete ? 'bg-brand-primary' : 'bg-amber-500/80'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="space-y-3 border-t border-brand-border pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">
          Completion certificate (optional shortcut)
        </p>
        {rollupCerts.length > 0 ? (
          rollupCerts.map((cert) => (
            <ThirtyTwoHourCertRow
              key={cert.id}
              cert={cert}
              editing={editing}
              onDelete={onDeleteCertification ? () => handleDelete(cert.id) : undefined}
            />
          ))
        ) : (
          <p className="text-xs text-brand-text-muted">No 32-hour completion certificate on file.</p>
        )}
        {editing && onAddCertification && rollupCerts.length === 0 && (
          <button
            type="button"
            onClick={() => startAdd(ROLLUP_COMPLETION_CATALOG_ID)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-brand-primary/40 text-brand-primary text-xs font-semibold hover:bg-brand-primary/10"
          >
            <Plus className="w-3.5 h-3.5" />
            Add completion cert
          </button>
        )}
      </div>

      <div className="space-y-2 border-t border-brand-border pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">
          Individual courses ({THIRTY_TWO_HOUR_COURSE_IDS.length} required)
        </p>
        <div className="space-y-2">
          {courses.map((course) => {
            const uploadStatus = getCourseUploadStatus(guard, course.id);
            const onFile = uploadStatus !== 'missing';
            const uploaded = certsForCatalogId(guard, course.id);
            const isAdding = addingCatalogId === course.id;

            return (
              <div key={course.id} className="rounded-xl surface-muted p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${onFile ? 'text-brand-text' : 'text-brand-text-muted'}`}>
                      {course.name}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getCourseUploadStatusBadgeClass(uploadStatus)}`}
                  >
                    {onFile ? <Check className="w-3 h-3" /> : null}
                    {getCourseUploadStatusLabel(uploadStatus)}
                  </span>
                </div>

                {uploaded.map((cert) => (
                  <ThirtyTwoHourCertRow
                    key={cert.id}
                    cert={cert}
                    editing={editing}
                    compact
                    showUploadBadge={false}
                    onDelete={onDeleteCertification ? () => handleDelete(cert.id) : undefined}
                  />
                ))}

                {editing && onAddCertification && !isAdding && (
                  <button
                    type="button"
                    onClick={() => startAdd(course.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {uploaded.length > 0 ? 'Add another' : 'Upload course cert'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {addingCatalogId && editing && (
        <form onSubmit={submitCert} className="space-y-3 border-t border-brand-border pt-3">
          <p className="text-sm font-semibold">
            Upload: {getCertCatalogEntry(addingCatalogId)?.name}
          </p>
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
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="uber-input w-full" />
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="uber-input w-full" />
          </div>
          <label className="flex items-center gap-2 text-xs text-brand-text-muted cursor-pointer">
            <ImagePlus className="w-4 h-4 shrink-0" />
            <span>Optional: attach scan or photo</span>
            <input type="file" accept="image/*" className="sr-only" onChange={handleImageSelect} />
          </label>
          {imageUrl && (
            <img src={imageUrl} alt="Credential preview" className="w-full max-h-40 object-contain rounded-lg border border-brand-border" />
          )}
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={resetForm} className="flex-1 uber-button-secondary h-11 text-sm">
              Cancel
            </button>
            <button type="submit" className="flex-1 uber-button-sage h-11 text-sm">
              Upload credential
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function ThirtyTwoHourCertRow({
  cert,
  editing,
  compact = false,
  showUploadBadge = true,
  onDelete,
}: {
  cert: Certification;
  editing: boolean;
  compact?: boolean;
  showUploadBadge?: boolean;
  onDelete?: () => void;
}) {
  const entry = cert.catalogId ? getCertCatalogEntry(cert.catalogId) : undefined;
  return (
    <div className={`flex justify-between gap-3 ${compact ? 'pl-2 border-l-2 border-brand-primary/30' : 'p-3 rounded-xl surface-muted'}`}>
      <div className="min-w-0 flex gap-3">
        {cert.imageUrl && !compact && (
          <img
            src={cert.imageUrl}
            alt={`${cert.name} document`}
            className="w-12 h-12 rounded-lg object-cover border border-brand-border shrink-0"
          />
        )}
        <div className="min-w-0">
          {!compact && <p className="font-semibold text-sm">{entry?.name ?? cert.name}</p>}
          <p className={`text-xs text-brand-text-muted ${compact ? '' : 'mt-0.5'}`}>
            {cert.state ? `${formatStateName(cert.state)} · ` : ''}
            {cert.issuer} · #{cert.number}
          </p>
          {cert.expiryDate && (
            <p className={`text-xs mt-0.5 ${isCertExpired(cert) ? 'text-amber-400' : 'text-brand-text-muted'}`}>
              {isCertExpired(cert) ? `Expired ${cert.expiryDate}` : `Expires ${cert.expiryDate}`}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <CredentialStatusBadges cert={cert} showUpload={showUploadBadge} />
        {editing && onDelete && (
          <button type="button" onClick={onDelete} className="text-xs text-red-400 flex items-center gap-1 hover:underline">
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
