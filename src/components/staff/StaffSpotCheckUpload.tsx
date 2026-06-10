import React, { useRef, useState } from 'react';
import { SecurityRequest } from '../../types';
import { canStaffUploadSpotCheck, isNoSpotCheckFlagged, sortedSpotChecks } from '../../lib/spotChecks';
import { NoSpotCheckBadge } from '../jobs/NoSpotCheckBadge';
import { ImagePlus, Loader2, MapPin } from 'lucide-react';

interface StaffSpotCheckUploadProps {
  request: SecurityRequest;
  onUpload: (requestId: string, imageUrl: string) => void | Promise<void>;
}

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

export function StaffSpotCheckUpload({ request, onUpload }: StaffSpotCheckUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const canUpload = canStaffUploadSpotCheck(request);
  const flagged = isNoSpotCheckFlagged(request);
  const history = sortedSpotChecks(request);

  const handleFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    setLoading(true);
    try {
      setPending(await readImageFile(file));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!pending) return;
    setSaving(true);
    try {
      await onUpload(request.id, pending);
      setPending(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-2 border-t border-brand-border space-y-3">
      <div className="flex items-start gap-2">
        <MapPin className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">Spot check</p>
            {flagged && <NoSpotCheckBadge />}
          </div>
          <p className="text-xs text-brand-text-muted mt-1">
            Staff-only — optional, but jobs are flagged until you upload a photo confirming the guard is on site.
          </p>
        </div>
      </div>

      {history.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">Previous checks</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {history.map((check) => (
              <div key={check.id}>
                <img
                  src={check.imageUrl}
                  alt="Spot check"
                  className="w-full h-24 object-cover rounded-lg border border-brand-border"
                />
                <p className="text-[10px] text-brand-text-muted mt-1 leading-snug">
                  {check.uploadedBy}
                  <br />
                  {new Date(check.uploadedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {canUpload && (
        <div className="space-y-2">
          {pending ? (
            <div className="relative">
              <img src={pending} alt="Spot check preview" className="w-full max-w-xs h-40 object-cover rounded-xl border border-brand-border" />
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
              className="w-full max-w-xs h-32 rounded-xl border border-dashed border-brand-border flex flex-col items-center justify-center gap-2 hover:border-brand-primary transition-colors surface-inset"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-brand-text-muted" />
              ) : (
                <>
                  <ImagePlus className="w-6 h-6 text-brand-text-muted" />
                  <span className="text-xs text-brand-text-muted">Upload spot check photo</span>
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
          {pending && (
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="app-button-primary !w-auto !h-9 !px-4 !text-xs gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Save spot check
            </button>
          )}
        </div>
      )}

      {!canUpload && history.length === 0 && (
        <p className="text-xs text-brand-text-muted">Assign a guard before uploading a spot check.</p>
      )}
    </div>
  );
}
