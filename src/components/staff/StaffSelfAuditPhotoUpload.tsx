import React, { useRef, useState } from 'react';
import { SecurityRequest } from '../../types';
import { NoSelfAuditBadge } from '../jobs/NoSelfAuditBadge';
import {
  getSelfAuditPhoto,
  isNoSelfAuditFlagged,
  missingSelfAuditPhotoKinds,
  NO_SELF_AUDIT_LABEL,
  SELF_AUDIT_PHOTO_LABELS,
  SelfAuditPhotoKind,
} from '../../lib/selfAuditPhotos';
import { Camera, ImagePlus, Loader2 } from 'lucide-react';
import { processDocumentPhotoFile } from '../../lib/documentPhoto';

function PhotoSlot({
  kind,
  currentUrl,
  onSelect,
}: {
  kind: SelfAuditPhotoKind;
  currentUrl?: string;
  onSelect: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    setLoading(true);
    try {
      onSelect(await processDocumentPhotoFile(file));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-brand-text-muted uppercase tracking-wide">
        {SELF_AUDIT_PHOTO_LABELS[kind]}
      </p>
      {currentUrl ? (
        <div className="relative">
          <img src={currentUrl} alt={SELF_AUDIT_PHOTO_LABELS[kind]} className="w-full h-32 object-cover rounded-xl border border-brand-border" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 app-button-outline !h-7 !px-2 !text-[10px] !w-auto bg-brand-surface/90"
          >
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="w-full h-32 rounded-xl border border-dashed border-brand-border flex flex-col items-center justify-center gap-2 hover:border-brand-primary transition-colors surface-inset"
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
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export type StaffSelfAuditPhotoPayload = Partial<Record<SelfAuditPhotoKind, string>>;

interface StaffSelfAuditPhotoUploadProps {
  request: SecurityRequest;
  onUpload: (requestId: string, photos: StaffSelfAuditPhotoPayload) => void | Promise<void>;
}

export function StaffSelfAuditPhotoUpload({ request, onUpload }: StaffSelfAuditPhotoUploadProps) {
  const audit = request.checkInAudit;
  const flagged = isNoSelfAuditFlagged(request);
  const missing = missingSelfAuditPhotoKinds(audit);
  const [pending, setPending] = useState<StaffSelfAuditPhotoPayload>({});
  const [saving, setSaving] = useState(false);

  const displayUrl = (kind: SelfAuditPhotoKind) => pending[kind] ?? getSelfAuditPhoto(audit, kind);

  const hasPending = Object.keys(pending).length > 0;

  const handleSave = async () => {
    if (!hasPending) return;
    setSaving(true);
    try {
      await onUpload(request.id, pending);
      setPending({});
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-2 border-t border-brand-border space-y-3">
      <div className="flex items-start gap-2">
        <Camera className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">Self-audit photos</p>
            {flagged && <NoSelfAuditBadge />}
          </div>
          <p className="text-xs text-brand-text-muted mt-1">
            {request.status === 'completed'
              ? `Upload all three photos to clear the ${NO_SELF_AUDIT_LABEL} flag on this completed job.`
              : 'Upload self, uniform, and shoes when a guard sent them outside the app or skipped the audit.'}
          </p>
          {audit?.staffUploadedBy && (
            <p className="text-xs text-brand-text-muted mt-1">
              Last staff upload by {audit.staffUploadedBy}
              {audit.staffUploadedAt ? ` · ${new Date(audit.staffUploadedAt).toLocaleString()}` : ''}
            </p>
          )}
          {missing.length > 0 && (
            <p className="text-xs text-amber-400/90 mt-1">Missing: {missing.map((k) => SELF_AUDIT_PHOTO_LABELS[k]).join(', ')}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['self', 'uniform', 'shoes'] as SelfAuditPhotoKind[]).map((kind) => (
          <PhotoSlot
            key={kind}
            kind={kind}
            currentUrl={displayUrl(kind)}
            onSelect={(dataUrl) => setPending((prev) => ({ ...prev, [kind]: dataUrl }))}
          />
        ))}
      </div>

      {hasPending && (
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="app-button-primary app-btn-sm gap-1.5"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Save audit photos
        </button>
      )}
    </div>
  );
}
