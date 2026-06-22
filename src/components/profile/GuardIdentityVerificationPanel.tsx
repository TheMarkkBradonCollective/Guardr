import React, { useRef, useState } from 'react';
import { SecurityGuard } from '../../types';
import {
  getGuardIdVerificationStatus,
  guardIdVerificationCanEdit,
  guardIdVerificationIsLocked,
  guardIdVerificationPhotosComplete,
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
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { IdVerificationImageModal } from './IdVerificationImageModal';
import { Camera, IdCard, ImagePlus, Loader2, UserRound } from 'lucide-react';

export interface GuardIdentityVerificationPayload {
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

function IdDocumentSlot({
  label,
  hint,
  currentUrl,
  locked,
  onSelect,
  icon: Icon,
}: {
  label: string;
  hint?: string;
  currentUrl?: string;
  locked: boolean;
  onSelect: (dataUrl: string) => void;
  icon: typeof IdCard;
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

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-brand-primary shrink-0" />
        <p className="text-xs font-semibold text-brand-text-muted uppercase tracking-wide">{label}</p>
      </div>
      {hint && <p className="text-xs text-brand-text-muted leading-relaxed">{hint}</p>}
      {currentUrl ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setViewOpen(true)}
            className="block w-full text-left group"
            aria-label={`View ${label}`}
          >
            <img
              src={currentUrl}
              alt={label}
              className="w-full h-36 object-cover rounded-xl border border-brand-border bg-brand-surface group-hover:opacity-90 transition-opacity"
            />
            <p className="text-[10px] text-brand-primary mt-1">Tap to view</p>
          </button>
          {!locked && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute bottom-8 right-2 app-button-outline !h-7 !px-2 !text-[10px] !w-auto bg-brand-surface/90"
            >
              Replace
            </button>
          )}
          {viewOpen && (
            <IdVerificationImageModal
              label={label}
              imageUrl={currentUrl}
              onClose={() => setViewOpen(false)}
            />
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading || locked}
          className="w-full h-36 rounded-xl border border-dashed border-brand-border flex flex-col items-center justify-center gap-2 hover:border-brand-primary transition-colors surface-inset disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-brand-text-muted" />
          ) : (
            <>
              <ImagePlus className="w-6 h-6 text-brand-text-muted" />
              <span className="text-xs text-brand-text-muted">Upload photo</span>
            </>
          )}
        </button>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
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
    </div>
  );
}

function SelfieSlot({
  currentUrl,
  locked,
  onSelect,
}: {
  currentUrl?: string;
  locked: boolean;
  onSelect: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewOpen, setViewOpen] = useState(false);

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

  const handleFile = async (file: File | undefined) => {
    if (!file || locked) return;
    setError('');
    setLoading(true);
    try {
      onSelect(await processIdentitySelfieFile(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <UserRound className="w-4 h-4 text-brand-primary shrink-0" />
        <p className="text-xs font-semibold text-brand-text-muted uppercase tracking-wide">
          {ID_VERIFICATION_SLOT_LABELS.selfie}
        </p>
      </div>
      <p className="text-xs text-brand-text-muted leading-relaxed">{ID_VERIFICATION_SELFIE_HINT}</p>
      {currentUrl ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setViewOpen(true)}
            className="block w-full text-left group"
            aria-label="View identity selfie"
          >
            <img
              src={currentUrl}
              alt="Identity selfie"
              className="w-full h-44 object-cover rounded-xl border border-brand-border bg-brand-surface group-hover:opacity-90 transition-opacity"
            />
            <p className="text-[10px] text-brand-primary mt-1">Tap to view</p>
          </button>
          {!locked && (
            <div className="absolute bottom-8 right-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => void handleCapture()}
                className="app-button-outline !h-7 !px-2 !text-[10px] !w-auto bg-brand-surface/90 gap-1"
              >
                <Camera className="w-3 h-3" /> Retake
              </button>
            </div>
          )}
          {viewOpen && (
            <IdVerificationImageModal
              label={ID_VERIFICATION_SLOT_LABELS.selfie}
              imageUrl={currentUrl}
              onClose={() => setViewOpen(false)}
            />
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void handleCapture()}
            disabled={loading || locked}
            className="w-full h-44 rounded-xl border border-dashed border-brand-primary/40 flex flex-col items-center justify-center gap-2 hover:border-brand-primary transition-colors surface-inset disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-8 h-8 animate-spin text-brand-text-muted" />
            ) : (
              <>
                <Camera className="w-8 h-8 text-brand-primary" />
                <span className="text-sm font-medium text-brand-primary">Take identity selfie</span>
                <span className="text-[10px] text-brand-text-muted px-4 text-center">Not your profile photo</span>
              </>
            )}
          </button>
          {!locked && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="text-xs text-brand-text-muted hover:text-brand-primary underline"
            >
              Upload a photo instead
            </button>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        disabled={locked}
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
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

  const [frontUrl, setFrontUrl] = useState(guard.idFrontUrl ?? '');
  const [backUrl, setBackUrl] = useState(guard.idBackUrl ?? '');
  const [selfieUrl, setSelfieUrl] = useState(guard.idSelfieUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  React.useEffect(() => {
    setFrontUrl(guard.idFrontUrl ?? '');
    setBackUrl(guard.idBackUrl ?? '');
    setSelfieUrl(guard.idSelfieUrl ?? '');
    setSubmitError('');
  }, [guard.id, guard.idFrontUrl, guard.idBackUrl, guard.idSelfieUrl, guard.idVerificationStatus]);

  const draftFront = frontUrl.trim();
  const draftBack = backUrl.trim();
  const draftSelfie = selfieUrl.trim();
  const draftComplete = Boolean(draftFront && draftBack && draftSelfie);
  const hasDraftChanges =
    draftFront !== (guard.idFrontUrl ?? '').trim() ||
    draftBack !== (guard.idBackUrl ?? '').trim() ||
    draftSelfie !== (guard.idSelfieUrl ?? '').trim();
  const showSubmit = staffMode
    ? canEdit && hasDraftChanges && (draftComplete || Boolean(draftFront || draftBack || draftSelfie))
    : canEdit && draftComplete;

  const statusTone =
    status === 'verified' ? 'success' : status === 'pending' ? 'warning' : status === 'rejected' ? 'danger' : 'default';

  const handleSubmit = async () => {
    if (!showSubmit) return;
    setSaving(true);
    setSubmitError('');
    try {
      const result = await onSubmit({
        idFrontUrl: draftFront || guard.idFrontUrl?.trim() || '',
        idBackUrl: draftBack || guard.idBackUrl?.trim() || '',
        idSelfieUrl: draftSelfie || guard.idSelfieUrl?.trim() || '',
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
        <p className="text-sm text-brand-text-muted leading-relaxed">{ID_VERIFICATION_POLICY_HINT}</p>
      )}
      {staffMode && (
        <p className="text-sm text-brand-text-muted leading-relaxed">
          Upload or replace ID photos on behalf of the guard. Saving a complete set queues the submission for
          staff review.
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
          Submitted {guard.idVerificationSubmittedAt ? new Date(guard.idVerificationSubmittedAt).toLocaleString() : ''} — Guardr staff will review your documents.
        </p>
      )}

      {status === 'verified' && guard.idVerificationReviewedAt && (
        <p className="text-sm text-emerald-400/90">
          Verified {new Date(guard.idVerificationReviewedAt).toLocaleString()}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <IdDocumentSlot
          label={ID_VERIFICATION_SLOT_LABELS.front}
          currentUrl={frontUrl || guard.idFrontUrl}
          locked={locked}
          onSelect={setFrontUrl}
          icon={IdCard}
        />
        <IdDocumentSlot
          label={ID_VERIFICATION_SLOT_LABELS.back}
          currentUrl={backUrl || guard.idBackUrl}
          locked={locked}
          onSelect={setBackUrl}
          icon={IdCard}
        />
        <div className="sm:col-span-2">
          <SelfieSlot currentUrl={selfieUrl || guard.idSelfieUrl} locked={locked} onSelect={setSelfieUrl} />
        </div>
      </div>

      {showSubmit && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving}
            className="app-button-primary !w-auto !h-10 !px-5 !text-sm gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Saving…' : staffMode ? 'Save ID photos' : 'Submit for review'}
          </button>
          {submitError && <p className="text-xs text-red-500">{submitError}</p>}
        </div>
      )}

      {!staffMode && locked && guardIdVerificationPhotosComplete(guard) && status !== 'rejected' && (
        <p className="text-xs text-brand-text-muted">Photos are locked while your submission is on file.</p>
      )}
    </>
  );

  if (embedded) {
    return <div className="space-y-4">{body}</div>;
  }

  return (
    <section className={`space-y-4 ${compact ? '' : 'py-4 border-b border-brand-border'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <WfSectionHeader title={staffMode ? 'ID photos' : 'ID verification'} className="mb-0" />
        <WfBadge tone={statusTone}>{ID_VERIFICATION_STATUS_LABELS[status]}</WfBadge>
      </div>
      {body}
    </section>
  );
}
