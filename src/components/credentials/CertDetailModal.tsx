import React, { useState } from 'react';
import { Loader2, Pencil, X } from 'lucide-react';
import { Certification } from '../../types';
import { certDisplayName, getCertCatalogEntry, resolveCertCatalogId } from '../../lib/certCatalog';
import { certCategoryLabel, certViewSectionLabel } from '../../lib/guardCredentialSections';
import { certPhotoIsLockedForEditor } from '../../lib/certImagePolicy';
import { isCertExpired } from '../../lib/certStatus';
import { formatStateName, US_STATES } from '../../lib/states';
import { CredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { AppModal } from '../ui/motion/AppMotion';
import { CredentialCategoryBadge } from './CredentialCategoryBadge';
import { CertPhotoRow } from './CertPhotoRow';

export interface CertUpdatePayload {
  issuer: string;
  number: string;
  state?: string;
  expiryDate: string;
  imageUrl?: string;
}

export type CertUpdateResult = { ok: true } | { ok: false; error: string };

interface CertDetailModalProps {
  cert: Certification;
  onClose: () => void;
  guardName?: string;
  canEdit?: boolean;
  staffMode?: boolean;
  initialEditMode?: boolean;
  onSubmit?: (payload: CertUpdatePayload) => Promise<CertUpdateResult>;
}

function formatDisplayDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function certHasDetailsOnFile(cert: Certification): boolean {
  return Boolean(cert.issuer?.trim() || cert.number?.trim() || cert.imageUrl?.trim());
}

export function CertDetailModal({
  cert,
  onClose,
  guardName,
  canEdit = false,
  staffMode = false,
  initialEditMode = false,
  onSubmit,
}: CertDetailModalProps) {
  const catalogId = resolveCertCatalogId(cert);
  const entry = catalogId ? getCertCatalogEntry(catalogId) : undefined;
  const title = certDisplayName(cert);
  const sectionLabel = certViewSectionLabel(cert);
  const categoryLabel = certCategoryLabel(cert);
  const requiresState = Boolean(entry?.requiresState);

  const [editing, setEditing] = useState(initialEditMode && canEdit && !!onSubmit);
  const [issuer, setIssuer] = useState(cert.issuer ?? '');
  const [number, setNumber] = useState(cert.number ?? '');
  const [state, setState] = useState(cert.state ?? 'CA');
  const [expiryDate, setExpiryDate] = useState(cert.expiryDate ?? '');
  const [imageUrl, setImageUrl] = useState(cert.imageUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const photosLocked = certPhotoIsLockedForEditor(cert, staffMode);

  React.useEffect(() => {
    setIssuer(cert.issuer ?? '');
    setNumber(cert.number ?? '');
    setState(cert.state ?? 'CA');
    setExpiryDate(cert.expiryDate ?? '');
    setImageUrl(cert.imageUrl ?? '');
    setSubmitError('');
    if (!initialEditMode) {
      setEditing(false);
    }
  }, [
    cert.id,
    cert.issuer,
    cert.number,
    cert.state,
    cert.expiryDate,
    cert.imageUrl,
    cert.status,
    cert.rejectionReason,
    initialEditMode,
  ]);

  const displayCert: Certification = {
    ...cert,
    issuer: issuer.trim() || cert.issuer,
    number: number.trim() || cert.number,
    state: requiresState ? state.trim().toUpperCase() || cert.state : cert.state,
    expiryDate: expiryDate.trim() || cert.expiryDate,
    imageUrl: imageUrl.trim() || cert.imageUrl,
  };

  const draftIssuer = issuer.trim();
  const draftNumber = number.trim();
  const draftState = state.trim().toUpperCase();
  const draftExpiry = expiryDate.trim();
  const draftImage = imageUrl.trim();
  const draftComplete = Boolean(
    draftIssuer && draftNumber && draftExpiry && (!requiresState || draftState)
  );

  const handleSave = async () => {
    if (!onSubmit) return;
    if (!draftIssuer || !draftNumber) {
      setSubmitError('Enter the issuing organization and credential number.');
      return;
    }
    if (!draftExpiry) {
      setSubmitError('Enter the expiration date.');
      return;
    }
    if (requiresState && !draftState) {
      setSubmitError('Select the issuing state.');
      return;
    }

    setSaving(true);
    setSubmitError('');
    try {
      const result = await onSubmit({
        issuer: draftIssuer,
        number: draftNumber,
        state: requiresState ? draftState : undefined,
        expiryDate: draftExpiry,
        imageUrl: draftImage || undefined,
      });
      if (result.ok === false) {
        setSubmitError(result.error);
        return;
      }
      setEditing(false);
      if (initialEditMode) {
        onClose();
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save credential.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIssuer(cert.issuer ?? '');
    setNumber(cert.number ?? '');
    setState(cert.state ?? 'CA');
    setExpiryDate(cert.expiryDate ?? '');
    setImageUrl(cert.imageUrl ?? '');
    setSubmitError('');
    if (initialEditMode && !certHasDetailsOnFile(cert)) {
      onClose();
      return;
    }
    setEditing(false);
  };

  return (
    <AppModal open onClose={onClose} ariaLabelledBy="cert-detail-title">
      <div className="flex items-start justify-between gap-3 p-5 border-b border-brand-border">
        <div className="min-w-0">
          {guardName && <p className="text-xs text-brand-text-muted mb-1">{guardName}</p>}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <CredentialCategoryBadge cert={cert} />
            {sectionLabel !== categoryLabel && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-brand-text-muted">
                {categoryLabel}
              </span>
            )}
          </div>
          <h2 id="cert-detail-title" className="font-bold text-lg leading-snug">
            {editing ? `Edit ${title}` : title}
          </h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canEdit && onSubmit && !editing && (staffMode || !photosLocked) && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="app-button-outline !w-auto !h-9 !px-3 !text-xs gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-brand-text-muted hover:text-brand-text hover:bg-brand-border/20"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5 max-h-[min(80vh,40rem)] overflow-y-auto">
        <div className="flex flex-wrap gap-2">
          <CredentialStatusBadges cert={displayCert} />
        </div>

        {cert.status === 'rejected' && cert.rejectionReason && (
          <p className="text-sm text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2 leading-relaxed">
            {cert.rejectionReason}
          </p>
        )}

        {editing ? (
          <div className="space-y-4">
            <div className="space-y-3">
              {requiresState && (
                <>
                  <label className="uber-label">Issuing state</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="uber-select w-full"
                    required
                    aria-label="Credential issuing state"
                  >
                    {US_STATES.map(({ code, name }) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </>
              )}
              <label className="uber-label">Issuing organization</label>
              <input
                className="uber-input w-full"
                placeholder="e.g. BSIS, training provider"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                required
                aria-label="Issuing organization"
              />
              <label className="uber-label">License / cert number</label>
              <input
                className="uber-input w-full"
                placeholder="Certificate or license number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
                aria-label="Credential number"
              />
              <label className="uber-label">Expiration date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="uber-input w-full"
                required
                aria-label="Expiration date"
              />
            </div>

            <div className="space-y-2">
              <p className="uber-label">Document photo</p>
              <CertPhotoRow
                label="Credential photo"
                currentUrl={imageUrl || undefined}
                locked={photosLocked}
                onSelect={setImageUrl}
              />
            </div>

            {submitError && <p className="text-xs text-red-500">{submitError}</p>}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !draftComplete}
                className="app-button-primary !w-auto !h-10 !px-5 !text-sm gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving…' : staffMode ? 'Save credential' : 'Submit for review'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="app-button-outline !w-auto !h-10 !px-4 !text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {displayCert.imageUrl ? (
              <img
                src={displayCert.imageUrl}
                alt={`${title} document`}
                className="w-full max-h-[min(52vh,28rem)] object-contain rounded-xl border border-brand-border bg-brand-bg-sec"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-12 rounded-xl border border-dashed border-brand-border bg-brand-bg-sec text-brand-text-muted">
                <p className="text-sm">No photo uploaded for this credential</p>
              </div>
            )}

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-brand-text-muted">Category</dt>
                <dd className="font-medium mt-0.5">{sectionLabel}</dd>
              </div>
              <div>
                <dt className="text-xs text-brand-text-muted">Credential group</dt>
                <dd className="font-medium mt-0.5">{categoryLabel}</dd>
              </div>
              <div>
                <dt className="text-xs text-brand-text-muted">Issuing organization</dt>
                <dd className="font-medium mt-0.5">{displayCert.issuer || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-brand-text-muted">License / cert number</dt>
                <dd className="font-medium mt-0.5 font-mono text-[0.8125rem]">{displayCert.number || '—'}</dd>
              </div>
              {displayCert.state && (
                <div>
                  <dt className="text-xs text-brand-text-muted">State</dt>
                  <dd className="font-medium mt-0.5">{formatStateName(displayCert.state)}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-brand-text-muted">Expiry date</dt>
                <dd className={`font-medium mt-0.5 ${isCertExpired(displayCert) ? 'text-amber-500' : ''}`}>
                  {displayCert.expiryDate ? formatDisplayDate(displayCert.expiryDate) : '—'}
                  {isCertExpired(displayCert) ? ' (expired)' : ''}
                </dd>
              </div>
            </dl>

            {photosLocked && cert.imageUrl && cert.status !== 'rejected' && (
              <p className="text-xs text-brand-text-muted">
                Credential details are locked while your submission is on file. Tap Edit after staff requests a
                resubmit.
              </p>
            )}

            {entry?.description && (
              <p className="text-xs text-brand-text-muted leading-relaxed border-t border-brand-border pt-4">
                {entry.description}
              </p>
            )}
          </>
        )}
      </div>
    </AppModal>
  );
}
