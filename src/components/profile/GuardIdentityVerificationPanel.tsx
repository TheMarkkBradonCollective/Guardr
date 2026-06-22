import React, { useRef, useState } from 'react';
import { ChevronRight, IdCard, Loader2, UserRound } from 'lucide-react';
import { SecurityGuard } from '../../types';
import {
  getGuardIdVerificationStatus,
  guardIdVerificationCanEdit,
  guardIdVerificationIsLocked,
  guardIdVerificationPhotosComplete,
  guardIdVerificationSubmissionReady,
  ID_VERIFICATION_POLICY_HINT,
  ID_VERIFICATION_SELFIE_HINT,
  ID_VERIFICATION_SLOT_LABELS,
  ID_VERIFICATION_STATUS_LABELS,
} from '../../lib/guardIdentityVerification';
import { getGuardUserStatus } from '../../lib/accountStatus';
import {
  captureIdentitySelfie,
  processIdDocumentFile,
  processIdentitySelfieFile,
} from '../../lib/idVerificationPhoto';
import { formatStateName, US_STATES } from '../../lib/states';
import { WfBadge } from '../ui/wireframe';
import { IdVerificationImageModal } from './IdVerificationImageModal';
import { GuardIdDetailModal } from './GuardIdDetailModal';

export interface GuardIdentityVerificationPayload {
  idState: string;
  idNumber: string;
  idFrontUrl: string;
  idBackUrl: string;
  idSelfieUrl: string;
}

export type IdentityVerificationSubmitResult = { ok: true } | { ok: false; error: string };

interface GuardIdentityVerificationPanelProps {
  guard: SecurityGuard;
  onSubmit: (payload: GuardIdentityVerificationPayload) => Promise<IdentityVerificationSubmitResult>;
  compact?: boolean;
  /** Staff can upload or replace ID photos regardless of guard lock state. */
  staffMode?: boolean;
  /** Render without outer section chrome — for use inside staff review. */
  embedded?: boolean;
}

type IdSlot = 'front' | 'back' | 'selfie';

function IdPhotoCertRow({
  label,
  hint,
  currentUrl,
  locked,
  onSelect,
  icon: Icon,
  selfie = false,
}: {
  label: string;
  hint?: string;
  currentUrl?: string;
  locked: boolean;
  onSelect: (dataUrl: string) => void;
  icon: typeof IdCard;
  selfie?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewOpen, setViewOpen] = useState(false);

  const handleFile = async (file: File | undefined, processor: (f: File) => Promise<string>) => {
    if (!file || locked) return;
    setError('');
    setLoading(true);
    try {
      onSelect(await processor(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process image.');
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async () => {
    if (locked) return;
    setError('');
    setLoading(true);
    try {
      const dataUrl = await captureIdentitySelfie();
      if (!dataUrl) {
        setError('Camera unavailable. Allow camera access or upload a photo instead.');
        return;
      }
      onSelect(dataUrl);
    } finally {
      setLoading(false);
    }
  };

  const triggerUpload = () => {
    if (selfie) {
      void handleCapture();
    } else {
      inputRef.current?.click();
    }
  };

  return (
    <>
      <div className="app-cert-item">
        {currentUrl ? (
          <button
            type="button"
            onClick={() => setViewOpen(true)}
            className="app-cert-item-interactive app-cert-item-body min-w-0 flex gap-3 flex-1 text-left"
          >
            <img
              src={currentUrl}
              alt={label}
              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-brand-border"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm leading-snug">{label}</p>
              <p className="text-xs text-brand-text-muted mt-1">Tap to view photo</p>
            </div>
          </button>
        ) : (
          <div className="app-cert-item-body min-w-0 flex gap-3 flex-1">
            <div className="w-14 h-14 rounded-xl border border-dashed border-brand-border flex items-center justify-center shrink-0 bg-brand-bg-sec">
              <Icon className="w-5 h-5 text-brand-text-muted" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm leading-snug">{label}</p>
              {hint && <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">{hint}</p>}
              <p className="text-[10px] text-brand-text-muted mt-1">No photo on file</p>
            </div>
          </div>
        )}
        <div className="app-cert-item-meta">
          {!locked && (
            <button
              type="button"
              onClick={triggerUpload}
              disabled={loading}
              className="text-xs text-brand-primary hover:underline disabled:opacity-50"
            >
              {loading ? '…' : currentUrl ? 'Replace' : selfie ? 'Take photo' : 'Upload'}
            </button>
          )}
          {currentUrl && (
            <button
              type="button"
              onClick={() => setViewOpen(true)}
              className="p-1 text-brand-text-muted hover:text-brand-text"
              aria-label={`View ${label}`}
            >
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-500 px-1 -mt-1 mb-1">{error}</p>}
      <IdVerificationImageModal open={viewOpen} label={label} imageUrl={currentUrl} onClose={() => setViewOpen(false)} />
      {!selfie ? (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={locked}
          onChange={(e) => {
            void handleFile(e.target.files?.[0], processIdDocumentFile);
            e.target.value = '';
          }}
        />
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            disabled={locked}
            onChange={(e) => {
              void handleFile(e.target.files?.[0], processIdentitySelfieFile);
              e.target.value = '';
            }}
          />
          {!locked && !currentUrl && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-[10px] text-brand-text-muted hover:text-brand-primary underline ml-1 mb-2"
            >
              Upload a photo instead
            </button>
          )}
        </>
      )}
    </>
  );
}

export function GuardIdentityVerificationPanel({
  guard,
  onSubmit,
  compact = false,
  staffMode = false,
  embedded = false,
}: GuardIdentityVerificationPanelProps) {
  const status = getGuardIdVerificationStatus(guard);
  const applicationBlocked = getGuardUserStatus(guard) === 'blocked';
  const locked = staffMode ? applicationBlocked : guardIdVerificationIsLocked(guard);
  const canEdit = staffMode ? !applicationBlocked : guardIdVerificationCanEdit(guard);

  const [idState, setIdState] = useState(guard.idState ?? 'CA');
  const [idNumber, setIdNumber] = useState(guard.idNumber ?? '');
  const [frontUrl, setFrontUrl] = useState(guard.idFrontUrl ?? '');
  const [backUrl, setBackUrl] = useState(guard.idBackUrl ?? '');
  const [selfieUrl, setSelfieUrl] = useState(guard.idSelfieUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);

  React.useEffect(() => {
    setIdState(guard.idState ?? 'CA');
    setIdNumber(guard.idNumber ?? '');
    setFrontUrl(guard.idFrontUrl ?? '');
    setBackUrl(guard.idBackUrl ?? '');
    setSelfieUrl(guard.idSelfieUrl ?? '');
    setSubmitError('');
  }, [
    guard.id,
    guard.idState,
    guard.idNumber,
    guard.idFrontUrl,
    guard.idBackUrl,
    guard.idSelfieUrl,
    guard.idVerificationStatus,
  ]);

  const draftState = idState.trim().toUpperCase();
  const draftNumber = idNumber.trim();
  const draftFront = frontUrl.trim();
  const draftBack = backUrl.trim();
  const draftSelfie = selfieUrl.trim();
  const draftComplete = guardIdVerificationSubmissionReady({
    idState: draftState,
    idNumber: draftNumber,
    idFrontUrl: draftFront,
    idBackUrl: draftBack,
    idSelfieUrl: draftSelfie,
  });
  const hasDraftChanges =
    draftState !== (guard.idState ?? '').trim().toUpperCase() ||
    draftNumber !== (guard.idNumber ?? '').trim() ||
    draftFront !== (guard.idFrontUrl ?? '').trim() ||
    draftBack !== (guard.idBackUrl ?? '').trim() ||
    draftSelfie !== (guard.idSelfieUrl ?? '').trim();
  const showSubmit = staffMode
    ? canEdit && hasDraftChanges && (draftComplete || Boolean(draftFront || draftBack || draftSelfie || draftNumber))
    : canEdit && draftComplete;

  const statusTone =
    status === 'verified' ? 'success' : status === 'pending' ? 'warning' : status === 'rejected' ? 'danger' : 'default';

  const hasOnFile = guardIdVerificationPhotosComplete(guard) || Boolean(guard.idState || guard.idNumber);
  const showSummaryRow = !canEdit && hasOnFile;

  const handleSubmit = async () => {
    if (!showSubmit) return;
    if (!draftState || !draftNumber) {
      setSubmitError('Enter the issuing state and ID number.');
      return;
    }
    if (!draftFront || !draftBack || !draftSelfie) {
      setSubmitError('Upload ID front, ID back, and an identity selfie before submitting.');
      return;
    }
    setSaving(true);
    setSubmitError('');
    try {
      const result = await onSubmit({
        idState: draftState,
        idNumber: draftNumber,
        idFrontUrl: draftFront,
        idBackUrl: draftBack,
        idSelfieUrl: draftSelfie,
      });
      if (result.ok === false) {
        setSubmitError(result.error);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save ID verification.');
    } finally {
      setSaving(false);
    }
  };

  const body = (
    <>
      {!staffMode && !embedded && (
        <p className="text-xs text-brand-text-muted leading-relaxed">{ID_VERIFICATION_POLICY_HINT}</p>
      )}
      {staffMode && (
        <p className="text-sm text-brand-text-muted leading-relaxed">
          Upload or replace ID photos on behalf of the guard. Enter the issuing state and ID number. Saving a complete set
          queues the submission for staff review.
        </p>
      )}

      {!staffMode && status === 'rejected' && guard.idVerificationRejectionReason && (
        <p className="text-sm text-amber-500 border border-amber-500/30 rounded-lg px-3 py-2">
          Staff requested a resubmit — approval is on hold until you upload again. {guard.idVerificationRejectionReason}
        </p>
      )}

      {staffMode && status === 'rejected' && guard.idVerificationRejectionReason && (
        <p className="text-sm text-amber-500 border border-amber-500/30 rounded-lg px-3 py-2 leading-relaxed">
          Resubmit requested — approval on hold. {guard.idVerificationRejectionReason}
        </p>
      )}

      {!staffMode && status === 'pending' && (
        <p className="text-sm text-amber-400/90">
          Submitted {guard.idVerificationSubmittedAt ? new Date(guard.idVerificationSubmittedAt).toLocaleString() : ''} —
          Guardr staff will review your documents.
        </p>
      )}

      {status === 'verified' && guard.idVerificationReviewedAt && (
        <p className="text-sm text-emerald-400/90">
          Verified {new Date(guard.idVerificationReviewedAt).toLocaleString()}
        </p>
      )}

      {showSummaryRow ? (
        <div className="app-cert-item-stack border-t border-brand-border pt-3">
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="app-cert-item app-cert-item-interactive w-full text-left"
          >
            <div className="app-cert-item-body min-w-0 flex gap-3 flex-1">
              {guard.idFrontUrl ? (
                <img
                  src={guard.idFrontUrl}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-brand-border"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl border border-brand-border bg-brand-bg-sec flex items-center justify-center shrink-0">
                  <IdCard className="w-5 h-5 text-brand-text-muted" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm leading-snug">Government ID</p>
                <p className="text-xs text-brand-text-muted mt-1">
                  {guard.idState ? `${formatStateName(guard.idState)} · ` : ''}
                  {guard.idNumber ? `#${guard.idNumber}` : 'ID on file'}
                </p>
                <p className="text-[10px] text-brand-primary mt-1">Tap to view details and photos</p>
              </div>
            </div>
            <div className="app-cert-item-meta">
              <WfBadge tone={statusTone}>{ID_VERIFICATION_STATUS_LABELS[status]}</WfBadge>
              <ChevronRight className="w-4 h-4 text-brand-text-muted shrink-0" />
            </div>
          </button>
        </div>
      ) : (
        <>
          {canEdit && (
            <div className="space-y-3 border-t border-brand-border pt-3">
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
              <input
                className="uber-input w-full"
                placeholder="Government ID number (driver license, state ID, etc.)"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                required
                aria-label="Government ID number"
              />
            </div>
          )}

          {!canEdit && (guard.idState || guard.idNumber) && (
            <dl className="grid grid-cols-2 gap-3 text-sm border-t border-brand-border pt-3">
              <div>
                <dt className="text-xs text-brand-text-muted">Issuing state</dt>
                <dd className="font-medium mt-0.5">{guard.idState ? formatStateName(guard.idState) : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-brand-text-muted">ID number</dt>
                <dd className="font-medium mt-0.5">{guard.idNumber ? `#${guard.idNumber}` : '—'}</dd>
              </div>
            </dl>
          )}

          <div className="app-cert-item-stack border-t border-brand-border">
            <IdPhotoCertRow
              label={ID_VERIFICATION_SLOT_LABELS.front}
              currentUrl={frontUrl || guard.idFrontUrl}
              locked={locked}
              onSelect={setFrontUrl}
              icon={IdCard}
            />
            <IdPhotoCertRow
              label={ID_VERIFICATION_SLOT_LABELS.back}
              currentUrl={backUrl || guard.idBackUrl}
              locked={locked}
              onSelect={setBackUrl}
              icon={IdCard}
            />
            <IdPhotoCertRow
              label={ID_VERIFICATION_SLOT_LABELS.selfie}
              hint={ID_VERIFICATION_SELFIE_HINT}
              currentUrl={selfieUrl || guard.idSelfieUrl}
              locked={locked}
              onSelect={setSelfieUrl}
              icon={UserRound}
              selfie
            />
          </div>
        </>
      )}

      {showSubmit && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving}
            className="app-button-primary !w-auto !h-10 !px-5 !text-sm gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Saving…' : staffMode ? 'Save ID' : 'Submit for review'}
          </button>
          {submitError && <p className="text-xs text-red-500">{submitError}</p>}
        </div>
      )}

      {!staffMode && locked && guardIdVerificationPhotosComplete(guard) && status !== 'rejected' && (
        <p className="text-xs text-brand-text-muted">ID details are locked while your submission is on file.</p>
      )}

      {detailOpen && <GuardIdDetailModal guard={guard} onClose={() => setDetailOpen(false)} />}
    </>
  );

  if (embedded) {
    return <div className="space-y-4">{body}</div>;
  }

  return (
    <section className={`app-form-section space-y-3 ${compact ? '' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="uber-label flex items-center gap-2">
            <IdCard className="w-4 h-4 text-brand-primary" />
            {staffMode ? 'Government ID' : 'Government ID'}
          </p>
          {!staffMode && (
            <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
              Required for account activation. Enter your ID state and number, then upload front, back, and a selfie.
              Tap any item to view photos.
            </p>
          )}
        </div>
        <WfBadge tone={statusTone}>{ID_VERIFICATION_STATUS_LABELS[status]}</WfBadge>
      </div>
      {body}
    </section>
  );
}
