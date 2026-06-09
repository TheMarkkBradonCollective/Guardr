import React, { useMemo, useState } from 'react';
import { Certification, SecurityGuard } from '../../types';
import { getCertCatalogEntry, resolveCertCatalogId } from '../../lib/certCatalog';
import {
  getCourseUploadStatus,
  getCourseUploadStatusLabel,
} from '../../lib/certStatus';
import { CertItemCard } from '../credentials/CertItemCard';
import {
  getQualificationProgress,
  getThirtyTwoHourCourseCatalogEntries,
  THIRTY_TWO_HOUR_COURSE_IDS,
  THIRTY_TWO_HOUR_ROLLUP_IDS,
} from '../../lib/guardQualification';
import { BookOpen, ImagePlus, Plus } from 'lucide-react';
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
    <section className="app-form-section space-y-4">
      <div>
        <p className="uber-label flex items-center gap-2">
          <BookOpen className="w-4 h-4" strokeWidth={1.5} />
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
        <div className="app-medication-progress">
          <div className="app-medication-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="border-t border-brand-border pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mb-2">
          Completion certificate (optional shortcut)
        </p>
        {rollupCerts.length > 0 ? (
          <div className="app-cert-item-stack !pt-0">
            {rollupCerts.map((cert) => (
              <CertItemCard
                key={cert.id}
                cert={cert}
                editing={editing}
                onDelete={onDeleteCertification ? () => handleDelete(cert.id) : undefined}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-brand-text-muted py-2">No 32-hour completion certificate on file.</p>
        )}
        {editing && onAddCertification && rollupCerts.length === 0 && (
          <button
            type="button"
            onClick={() => startAdd(ROLLUP_COMPLETION_CATALOG_ID)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-text hover:underline py-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add completion cert
          </button>
        )}
      </div>

      <div className="border-t border-brand-border pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mb-2">
          Individual courses ({THIRTY_TWO_HOUR_COURSE_IDS.length} required)
        </p>
        {courses.map((course) => {
          const uploadStatus = getCourseUploadStatus(guard, course.id);
          const onFile = uploadStatus !== 'missing';
          const uploaded = certsForCatalogId(guard, course.id);

          return (
            <div key={course.id} className="app-list-subrow space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className={`text-sm font-semibold ${onFile ? 'text-brand-text' : 'text-brand-text-muted'}`}>
                  {course.name}
                </p>
                {uploaded.length === 0 && (
                  <span className="shrink-0 text-[10px] font-bold uppercase text-brand-text-muted">
                    {getCourseUploadStatusLabel(uploadStatus)}
                  </span>
                )}
              </div>

              {uploaded.length > 0 && (
                <div className="app-cert-item-stack !pt-0">
                  {uploaded.map((cert) => (
                    <CertItemCard
                      key={cert.id}
                      cert={cert}
                      editing={editing}
                      compact
                      onDelete={onDeleteCertification ? () => handleDelete(cert.id) : undefined}
                    />
                  ))}
                </div>
              )}

              {editing && onAddCertification && addingCatalogId !== course.id && (
                <button
                  type="button"
                  onClick={() => startAdd(course.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-text-muted hover:text-brand-text"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {uploaded.length > 0 ? 'Add another' : 'Upload course cert'}
                </button>
              )}
            </div>
          );
        })}
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
            <img src={imageUrl} alt="Credential preview" className="w-full max-h-40 object-contain rounded-lg" />
          )}
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={resetForm} className="flex-1 app-button-outline !h-11 !text-sm">
              Cancel
            </button>
            <button type="submit" className="flex-1 app-button-primary !h-11 !text-sm">
              Upload credential
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
