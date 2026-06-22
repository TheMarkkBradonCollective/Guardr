import React, { useState } from 'react';
import { IdCard, Loader2, Pencil, UserRound, X } from 'lucide-react';
import { SecurityGuard } from '../../types';
import {
  formatIdExpiryLabel,
  getGuardIdVerificationStatus,
  guardIdVerificationIsLocked,
  guardIdVerificationPhotosComplete,
  guardIdVerificationSubmissionReady,
  ID_VERIFICATION_SELFIE_HINT,
  ID_VERIFICATION_SLOT_LABELS,
  isIdExpired,
} from '../../lib/guardIdentityVerification';
import { formatStateName, US_STATES } from '../../lib/states';
import { AppModal } from '../ui/motion/AppMotion';
import { IdCredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { IdVerificationImageThumb } from './IdVerificationImageModal';
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
}

export function GuardIdDetailModal({
  guard,
  onClose,
  guardName,
  canEdit = false,
  staffMode = false,
  initialEditMode = false,
  onSubmit,
}: GuardIdDetailModalProps) {
  const status = getGuardIdVerificationStatus(guard);
  const locked = staffMode ? false : guardIdVerificationIsLocked(guard);
  const photosLocked = staffMode ? false : locked;

  const [editing, setEditing] = useState(initialEditMode && canEdit);
  const [idState, setIdState] = useState(guard.idState ?? 'CA');
  const [idNumber, setIdNumber] = useState(guard.idNumber ?? '');
  const [idExpiryDate, setIdExpiryDate] = useState(guard.idExpiryDate ?? '');
  const [frontUrl, setFrontUrl] = useState(guard.idFrontUrl ?? '');
  const [backUrl, setBackUrl] = useState(guard.idBackUrl ?? '');
  const [selfieUrl, setSelfieUrl] = useState(guard.idSelfieUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  React.useEffect(() => {
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
    guard.idState,
    guard.idNumber,
    guard.idExpiryDate,
    guard.idFrontUrl,
    guard.idBackUrl,
    guard.idSelfieUrl,
    guard.idVerificationStatus,
    initialEditMode,
  ]);

  const displayGuard: SecurityGuard = {
    ...guard,
    idState: idState.trim().toUpperCase() || guard.idState,
    idNumber: idNumber.trim() || guard.idNumber,
    idExpiryDate: idExpiryDate.trim() || guard.idExpiryDate,
    idFrontUrl: frontUrl.trim() || guard.idFrontUrl,
    idBackUrl: backUrl.trim() || guard.idBackUrl,
    idSelfieUrl: selfieUrl.trim() || guard.idSelfieUrl,
  };

  const expired = isIdExpired(displayGuard);
  const expiryLabel = formatIdExpiryLabel(displayGuard.idExpiryDate);

  const draftState = idState.trim().toUpperCase();
  const draftNumber = idNumber.trim();
  const draftExpiry = idExpiryDate.trim();
  const draftFront = frontUrl.trim();
  const draftBack = backUrl.trim();
  const draftSelfie = selfieUrl.trim();
  const draftComplete = guardIdVerificationSubmissionReady({
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
      setSubmitError('Upload ID front, ID back, and an identity selfie before saving.');
      return;
    }

    setSaving(true);
    setSubmitError('');
    try {
      const result = await onSubmit({
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
    <AppModal open onClose={onClose} ariaLabelledBy="guard-id-detail-title">
      <div className="flex items-start justify-between gap-3 p-5 border-b border-brand-border">
        <div className="min-w-0">
          {guardName && <p className="text-xs text-brand-text-muted mb-1">{guardName}</p>}
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mb-1">
            Government ID
          </p>
          <h2 id="guard-id-detail-title" className="font-bold text-lg leading-snug">
            {editing ? 'Edit government ID' : 'Identity verification'}
          </h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canEdit && !editing && !photosLocked && (
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
                  label={ID_VERIFICATION_SLOT_LABELS.front}
                  currentUrl={frontUrl}
                  locked={photosLocked}
                  onSelect={setFrontUrl}
                  icon={IdCard}
                />
                <GuardIdPhotoRow
                  label={ID_VERIFICATION_SLOT_LABELS.back}
                  currentUrl={backUrl}
                  locked={photosLocked}
                  onSelect={setBackUrl}
                  icon={IdCard}
                />
                <GuardIdPhotoRow
                  label={ID_VERIFICATION_SLOT_LABELS.selfie}
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
          <>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-brand-text-muted">Issuing state</dt>
                <dd className="font-medium mt-0.5">
                  {displayGuard.idState ? formatStateName(displayGuard.idState) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-brand-text-muted">ID number</dt>
                <dd className="font-medium mt-0.5 font-mono text-[0.8125rem]">
                  {displayGuard.idNumber ? `#${displayGuard.idNumber}` : '—'}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-brand-text-muted">Expiration date</dt>
                <dd className={`font-medium mt-0.5 ${expired ? 'text-amber-600' : ''}`}>
                  {expiryLabel ? (expired ? `Expired ${expiryLabel}` : expiryLabel) : '—'}
                </dd>
              </div>
            </dl>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <IdVerificationImageThumb
                label={ID_VERIFICATION_SLOT_LABELS.front}
                imageUrl={displayGuard.idFrontUrl}
                guardName={guardName}
              />
              <IdVerificationImageThumb
                label={ID_VERIFICATION_SLOT_LABELS.back}
                imageUrl={displayGuard.idBackUrl}
                guardName={guardName}
              />
              <div className="sm:col-span-2">
                <IdVerificationImageThumb
                  label={ID_VERIFICATION_SLOT_LABELS.selfie}
                  imageUrl={displayGuard.idSelfieUrl}
                  guardName={guardName}
                  imageClassName="w-full h-44 object-cover rounded-lg border border-brand-border bg-brand-bg-sec"
                  emptyClassName="h-44 rounded-lg border border-dashed border-brand-border bg-brand-bg-sec flex items-center justify-center text-xs text-brand-text-muted px-2 text-center"
                />
              </div>
            </div>

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
          </>
        )}
      </div>
    </AppModal>
  );
}
