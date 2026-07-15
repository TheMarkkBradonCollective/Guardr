import React, { useState } from 'react';
import { Loader2, Pencil, X } from 'lucide-react';
import { Certification } from '../../types';
import { certDisplayName, credentialRequiresExpiry, getCertCatalogEntry, resolveCertCatalogId } from '../../lib/certCatalog';
import { certCategoryLabel, certViewSectionLabel } from '../../lib/guardCredentialSections';
import { certPhotoIsLockedForEditor } from '../../lib/certImagePolicy';
import { formatStateName, US_STATES } from '../../lib/states';
import { CredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { AppOverlaySheet } from '../ui/motion/AppMotion';
import { CredentialCategoryBadge } from './CredentialCategoryBadge';
import { CertPhotoRow } from './CertPhotoRow';
import { CredentialRevisionTimeline } from './CredentialRevisionTimeline';

export interface CertUpdatePayload {
  issuer: string;
  number: string;
  state?: string;
  expiryDate?: string;
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
  const requiresExpiry = credentialRequiresExpiry(cert);

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
    if (editing) return;
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
    editing,
  ]);

  const displayCert: Certification = {
    ...cert,
    issuer: issuer.trim() || cert.issuer,
    number: number.trim() || cert.number,
    state: requiresState ? state.trim().toUpperCase() || cert.state : cert.state,
    expiryDate: requiresExpiry ? expiryDate.trim() || cert.expiryDate : cert.expiryDate,
    imageUrl: imageUrl.trim() || cert.imageUrl,
  };

  const draftIssuer = issuer.trim();
  const draftNumber = number.trim();
  const draftState = state.trim().toUpperCase();
  const draftExpiry = expiryDate.trim();
  const draftImage = imageUrl.trim();
  const draftComplete = Boolean(
    draftIssuer &&
      draftNumber &&
      draftImage &&
      (!requiresState || draftState) &&
      (!requiresExpiry || draftExpiry)
  );

  const handleSave = async () => {
    if (!onSubmit) return;
    if (!draftIssuer || !draftNumber) {
      setSubmitError('Enter the issuing organization and credential number.');
      return;
    }
    if (requiresState && !draftState) {
      setSubmitError('Select the issuing state.');
      return;
    }
    if (requiresExpiry && !draftExpiry) {
      setSubmitError('Enter the permit expiration date.');
      return;
    }
    if (!draftImage) {
      setSubmitError('Upload a photo or scan of the credential document.');
      return;
    }

    setSaving(true);
    setSubmitError('');
    try {
      const result = await onSubmit({
        issuer: draftIssuer,
        number: draftNumber,
        state: requiresState ? draftState : undefined,
        expiryDate: requiresExpiry ? draftExpiry : undefined,
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
    <AppOverlaySheet open onClose={onClose} ariaLabel={title} panelClassName="rounded-t-2xl">
      <div className="flex flex-col max-h-[85dvh]">
      <div className="shrink-0 flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-brand-border">
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

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 pb-8 space-y-5">
        <div className="flex flex-wrap gap-2">
          <CredentialStatusBadges cert={displayCert} />
        </div>

        {cert.status === 'rejected' && cert.rejectionReason && (
          <p className="text-sm text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2 leading-relaxed">
            {cert.rejectionReason}
          </p>
        )}

        {cert.updateRequestNote && !cert.pendingUpdate && (
          <p className="text-sm text-brand-primary border border-brand-primary/30 bg-brand-primary/10 rounded-lg px-3 py-2 leading-relaxed">
            {cert.updateRequestNote}
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
              {requiresExpiry && (
                <>
                  <label className="uber-label">Expiration date</label>
                  <input
                    type="date"
                    className="uber-input w-full"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                    aria-label="Permit expiration date"
                  />
                </>
              )}
            </div>

            <div className="space-y-2">
              <p className="uber-label">Document photo (required)</p>
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
              {requiresExpiry && (
                <div>
                  <dt className="text-xs text-brand-text-muted">Expiration date</dt>
                  <dd className="font-medium mt-0.5">
                    {displayCert.expiryDate
                      ? new Date(`${displayCert.expiryDate}T12:00:00`).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </dd>
                </div>
              )}
            </dl>

            <CredentialRevisionTimeline cert={cert} />
          </>
        )}
      </div>
      </div>
    </AppOverlaySheet>
  );
}
