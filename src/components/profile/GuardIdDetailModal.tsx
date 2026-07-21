import React, { useState } from 'react';
import { IdCard, Loader2, Pencil, UserRound, X } from 'lucide-react';
import type { GovernmentIdDocumentType, SecurityGuard } from '../../types';
import { DRIVER_LICENSE_CLASSES } from '../../types';
import {
  getGuardIdVerificationStatus,
  guardIdVerificationIsLocked,
  guardIdVerificationPhotosComplete,
  guardIdVerificationSubmissionReady,
  ID_VERIFICATION_SELFIE_HINT,
  governmentIdSlotLabels,
  governmentIdDocumentTypeLabel,
} from '../../lib/guardIdentityVerification';
import { staffCanEditGuardGovernmentId } from '../../lib/staffCredentialRules';
import { formatStateName, US_STATES } from '../../lib/states';
import { AppOverlaySheet } from '../ui/motion/AppMotion';
import { CredentialQuickViewLinks } from '../credentials/CredentialQuickViewLinks';
import { IdCredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { CredentialRecordsList } from '../credentials/CredentialRecordsList';
import { getGovIdArchiveHistory } from '../../lib/govIdRevisionHistory';
import { DocumentImagePreview } from '../credentials/DocumentImageLightbox';
import { GuardIdPhotoRow } from './GuardIdPhotoRow';
import type {
  GuardIdentityVerificationPayload,
  IdentityVerificationSubmitResult,
} from './GuardIdentityVerificationPanel';

interface GuardIdDetailModalProps {
  guard: SecurityGuard;
  onClose: () => void;
  guardName?: string;
  canEdit?: boolean;
  staffMode?: boolean;
  initialEditMode?: boolean;
  onSubmit: (payload: GuardIdentityVerificationPayload) => Promise<IdentityVerificationSubmitResult>;
  onViewFull?: () => void;
  viewFullLabel?: string;
  onEditFullPage?: () => void;
}

export function GuardIdDetailModal({
  guard,
  onClose,
  guardName,
  canEdit = false,
  staffMode = false,
  initialEditMode = false,
  onSubmit,
  onViewFull,
  viewFullLabel,
  onEditFullPage,
}: GuardIdDetailModalProps) {
  const status = getGuardIdVerificationStatus(guard);
  const staffMayEdit = staffMode && staffCanEditGuardGovernmentId(guard);
  const locked = staffMode ? !staffMayEdit : guardIdVerificationIsLocked(guard);
  const photosLocked = locked;
  const effectiveCanEdit = canEdit && (staffMode ? staffMayEdit : !locked);

  const [editing, setEditing] = useState(initialEditMode && effectiveCanEdit && !onEditFullPage);
  const [idDocumentType, setIdDocumentType] = useState<GovernmentIdDocumentType>(
    guard.idDocumentType ?? 'state_id'
  );
  const [idLicenseClass, setIdLicenseClass] = useState(guard.idLicenseClass ?? '');
  const [idState, setIdState] = useState(guard.idState ?? 'CA');
  const [idNumber, setIdNumber] = useState(guard.idNumber ?? '');
  const [idExpiryDate, setIdExpiryDate] = useState(guard.idExpiryDate ?? '');
  const [frontUrl, setFrontUrl] = useState(guard.idFrontUrl ?? '');
  const [backUrl, setBackUrl] = useState(guard.idBackUrl ?? '');
  const [selfieUrl, setSelfieUrl] = useState(guard.idSelfieUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  React.useEffect(() => {
    if (editing) return;
    setIdDocumentType(guard.idDocumentType ?? 'state_id');
    setIdLicenseClass(guard.idLicenseClass ?? '');
    setIdState(guard.idState ?? 'CA');
    setIdNumber(guard.idNumber ?? '');
    setIdExpiryDate(guard.idExpiryDate ?? '');
    setFrontUrl(guard.idFrontUrl ?? '');
    setBackUrl(guard.idBackUrl ?? '');
    setSelfieUrl(guard.idSelfieUrl ?? '');
    setSubmitError('');
    if (!initialEditMode) {
      setEditing(false);
    }
  }, [
    guard.id,
    guard.idDocumentType,
    guard.idLicenseClass,
    guard.idState,
    guard.idNumber,
    guard.idExpiryDate,
    guard.idFrontUrl,
    guard.idBackUrl,
    guard.idSelfieUrl,
    guard.idVerificationStatus,
    initialEditMode,
    editing,
  ]);

  const displayGuard: SecurityGuard = {
    ...guard,
    idDocumentType,
    idLicenseClass: idLicenseClass.trim() || guard.idLicenseClass,
    idState: idState.trim().toUpperCase() || guard.idState,
    idNumber: idNumber.trim() || guard.idNumber,
    idExpiryDate: idExpiryDate.trim() || guard.idExpiryDate,
    idFrontUrl: frontUrl.trim() || guard.idFrontUrl,
    idBackUrl: backUrl.trim() || guard.idBackUrl,
    idSelfieUrl: selfieUrl.trim() || guard.idSelfieUrl,
  };

  const idHistory = getGovIdArchiveHistory(guard);

  const draftState = idState.trim().toUpperCase();
  const draftNumber = idNumber.trim();
  const draftExpiry = idExpiryDate.trim();
  const draftFront = frontUrl.trim();
  const draftBack = backUrl.trim();
  const draftSelfie = selfieUrl.trim();
  const slotLabels = governmentIdSlotLabels(idDocumentType);
  const draftComplete = guardIdVerificationSubmissionReady({
    idDocumentType,
    idLicenseClass: idLicenseClass.trim(),
    idState: draftState,
    idNumber: draftNumber,
    idExpiryDate: draftExpiry,
    idFrontUrl: draftFront,
    idBackUrl: draftBack,
    idSelfieUrl: draftSelfie,
  });

  const handleSave = async () => {
    if (!draftState || !draftNumber) {
      setSubmitError('Enter the issuing state and ID number.');
      return;
    }
    if (!draftExpiry) {
      setSubmitError('Enter the ID expiration date.');
      return;
    }
    if (!draftFront || !draftBack || !draftSelfie) {
      setSubmitError(`Upload ${slotLabels.front.toLowerCase()}, ${slotLabels.back.toLowerCase()}, and an identity selfie before saving.`);
      return;
    }
    if (idDocumentType === 'drivers_license' && !idLicenseClass.trim()) {
      setSubmitError("Select your driver's license class.");
      return;
    }

    setSaving(true);
    setSubmitError('');
    try {
      const result = await onSubmit({
        idDocumentType,
        idLicenseClass: idLicenseClass.trim(),
        idState: draftState,
        idNumber: draftNumber,
        idExpiryDate: draftExpiry,
        idFrontUrl: draftFront,
        idBackUrl: draftBack,
        idSelfieUrl: draftSelfie,
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
      setSubmitError(err instanceof Error ? err.message : 'Could not save ID verification.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIdDocumentType(guard.idDocumentType ?? 'state_id');
    setIdLicenseClass(guard.idLicenseClass ?? '');
    setIdState(guard.idState ?? 'CA');
    setIdNumber(guard.idNumber ?? '');
    setIdExpiryDate(guard.idExpiryDate ?? '');
    setFrontUrl(guard.idFrontUrl ?? '');
    setBackUrl(guard.idBackUrl ?? '');
    setSelfieUrl(guard.idSelfieUrl ?? '');
    setSubmitError('');
    if (initialEditMode && !guardIdVerificationPhotosComplete(guard)) {
      onClose();
      return;
    }
    setEditing(false);
  };

  return (
    <AppOverlaySheet open onClose={onClose} ariaLabel="Government ID" panelClassName="rounded-t-2xl">
      <div className="flex flex-col flex-1 min-h-0 h-full">
      <div className="shrink-0 flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-brand-border">
        <div className="min-w-0">
          {guardName && <p className="text-xs text-brand-text-muted mb-1">{guardName}</p>}
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mb-1">
            {governmentIdDocumentTypeLabel(guard.idDocumentType)}
          </p>
          <h2 id="guard-id-detail-title" className="font-bold text-lg leading-snug">
            {editing ? `Edit ${governmentIdDocumentTypeLabel(idDocumentType).toLowerCase()}` : 'Identity verification'}
          </h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {effectiveCanEdit && !editing && !photosLocked && (
            onEditFullPage ? (
              <button
                type="button"
                onClick={() => {
                  onEditFullPage();
                  onClose();
                }}
                className="app-button-outline !w-auto !h-9 !px-3 !text-xs gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="app-button-outline !w-auto !h-9 !px-3 !text-xs gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )
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

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-5 popup-card-scroll-body">
        <div className="flex flex-wrap gap-2">
          <IdCredentialStatusBadges guard={displayGuard} />
        </div>

        {status === 'rejected' && guard.idVerificationRejectionReason && (
          <p className="text-sm text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2 leading-relaxed">
            {guard.idVerificationRejectionReason}
          </p>
        )}

        {editing ? (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="uber-label">Document type</label>
              <select
                value={idDocumentType}
                onChange={(e) => setIdDocumentType(e.target.value as GovernmentIdDocumentType)}
                className="uber-select w-full"
                aria-label="Government ID document type"
              >
                <option value="state_id">Government ID</option>
                <option value="drivers_license">Driver&apos;s license</option>
              </select>
              {idDocumentType === 'drivers_license' ? (
                <>
                  <label className="uber-label">License class</label>
                  <select
                    value={idLicenseClass}
                    onChange={(e) => setIdLicenseClass(e.target.value)}
                    className="uber-select w-full"
                    required
                    aria-label="Driver license class"
                  >
                    <option value="">Select class</option>
                    {DRIVER_LICENSE_CLASSES.map((licenseClass) => (
                      <option key={licenseClass} value={licenseClass}>
                        {licenseClass}
                      </option>
                    ))}
                  </select>
                </>
              ) : null}
              <label className="uber-label">Issuing state</label>
              <select
                value={idState}
                onChange={(e) => setIdState(e.target.value)}
                className="uber-select w-full"
                required
                aria-label="ID issuing state"
              >
                {US_STATES.map(({ code, name }) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
              <label className="uber-label">ID number</label>
              <input
                className="uber-input w-full"
                placeholder="Driver license, state ID, etc."
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                required
                aria-label="Government ID number"
              />
              <label className="uber-label">Expiration date</label>
              <input
                type="date"
                value={idExpiryDate}
                onChange={(e) => setIdExpiryDate(e.target.value)}
                className="uber-input w-full"
                required
                aria-label="ID expiration date"
              />
            </div>

            <div className="space-y-2">
              <p className="uber-label">Photos</p>
              <div className="app-cert-item-stack">
                <GuardIdPhotoRow
                  label={slotLabels.front}
                  currentUrl={frontUrl}
                  locked={photosLocked}
                  onSelect={setFrontUrl}
                  icon={IdCard}
                />
                <GuardIdPhotoRow
                  label={slotLabels.back}
                  currentUrl={backUrl}
                  locked={photosLocked}
                  onSelect={setBackUrl}
                  icon={IdCard}
                />
                <GuardIdPhotoRow
                  label={slotLabels.selfie}
                  hint={ID_VERIFICATION_SELFIE_HINT}
                  currentUrl={selfieUrl}
                  locked={photosLocked}
                  onSelect={setSelfieUrl}
                  icon={UserRound}
                  selfie
                />
              </div>
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
                {saving ? 'Saving…' : staffMode ? 'Save ID' : 'Submit for review'}
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
          <div className="space-y-5">
            <section className="space-y-4" aria-label="Current government ID">
              <dl className="space-y-3">
                <div>
                  <dt className="uber-label">Document type</dt>
                  <dd className="text-sm text-brand-text mt-1">
                    {governmentIdDocumentTypeLabel(displayGuard.idDocumentType)}
                  </dd>
                </div>
                {displayGuard.idDocumentType === 'drivers_license' && displayGuard.idLicenseClass ? (
                  <div>
                    <dt className="uber-label">License class</dt>
                    <dd className="text-sm text-brand-text mt-1">{displayGuard.idLicenseClass}</dd>
                  </div>
                ) : null}
                {displayGuard.idState ? (
                  <div>
                    <dt className="uber-label">Issuing state</dt>
                    <dd className="text-sm text-brand-text mt-1">{formatStateName(displayGuard.idState)}</dd>
                  </div>
                ) : null}
                {displayGuard.idNumber?.trim() ? (
                  <div>
                    <dt className="uber-label">ID number</dt>
                    <dd className="text-sm text-brand-text mt-1 font-mono">#{displayGuard.idNumber.trim()}</dd>
                  </div>
                ) : null}
                {displayGuard.idExpiryDate?.trim() ? (
                  <div>
                    <dt className="uber-label">Expiration date</dt>
                    <dd className="text-sm text-brand-text mt-1">{displayGuard.idExpiryDate.trim()}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayGuard.idFrontUrl?.trim() ? (
                  <DocumentImagePreview
                    imageUrl={displayGuard.idFrontUrl.trim()}
                    alt={slotLabels.front}
                    className="w-full max-h-48 object-contain rounded-xl border border-brand-border bg-brand-bg-sec"
                  />
                ) : null}
                {displayGuard.idBackUrl?.trim() ? (
                  <DocumentImagePreview
                    imageUrl={displayGuard.idBackUrl.trim()}
                    alt={slotLabels.back}
                    className="w-full max-h-48 object-contain rounded-xl border border-brand-border bg-brand-bg-sec"
                  />
                ) : null}
                {displayGuard.idSelfieUrl?.trim() ? (
                  <div className="sm:col-span-2">
                    <DocumentImagePreview
                      imageUrl={displayGuard.idSelfieUrl.trim()}
                      alt={slotLabels.selfie}
                      className="w-full max-h-48 object-contain rounded-xl border border-brand-border bg-brand-bg-sec"
                    />
                  </div>
                ) : null}
              </div>
            </section>

            {photosLocked && guardIdVerificationPhotosComplete(guard) && status !== 'rejected' && (
              <p className="text-xs text-brand-text-muted">
                ID details are locked while your submission is on file. Tap Edit after staff requests a resubmit.
              </p>
            )}

            {guard.idVerificationSubmittedAt && (
              <p className="text-xs text-brand-text-muted">
                Submitted {new Date(guard.idVerificationSubmittedAt).toLocaleString()}
              </p>
            )}

            {idHistory.length > 0 ? (
              <CredentialRecordsList
                items={idHistory}
                title="History"
                description="Earlier uploads. Tap any image for full size."
              />
            ) : null}

            <CredentialQuickViewLinks onViewFull={onViewFull} viewFullLabel={viewFullLabel} />
          </div>
        )}
      </div>
      </div>
    </AppOverlaySheet>
  );
}
