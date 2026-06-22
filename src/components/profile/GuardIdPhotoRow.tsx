import React, { useRef, useState } from 'react';
import { ChevronRight, IdCard, ImagePlus, Loader2 } from 'lucide-react';
import {
  captureIdentitySelfie,
  processIdDocumentFile,
  processIdentitySelfieFile,
} from '../../lib/idVerificationPhoto';
import { IdVerificationImageModal } from './IdVerificationImageModal';

export function GuardIdPhotoRow({
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
        {currentUrl && (
          <div className="app-cert-item-meta">
            <button
              type="button"
              onClick={() => setViewOpen(true)}
              className="p-1 text-brand-text-muted hover:text-brand-text"
              aria-label={`View ${label}`}
            >
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        )}
      </div>
      {!locked && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={triggerUpload}
            disabled={loading}
            className="w-full app-button-outline !h-11 !text-sm gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4" />
            )}
            {loading
              ? 'Processing…'
              : currentUrl
                ? 'Replace photo'
                : selfie
                  ? 'Take selfie'
                  : 'Upload photo'}
          </button>
          {selfie && !currentUrl && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="w-full app-button-outline !h-10 !text-xs gap-2 disabled:opacity-50"
            >
              Upload a photo instead
            </button>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-500 px-1 -mt-1 mb-1">{error}</p>}
      <IdVerificationImageModal open={viewOpen} label={label} imageUrl={currentUrl} onClose={() => setViewOpen(false)} />
      {!selfie ? (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={locked}
          onChange={(e) => {
            void handleFile(e.target.files?.[0], processIdDocumentFile);
            e.target.value = '';
          }}
        />
      ) : (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="sr-only"
          disabled={locked}
          onChange={(e) => {
            void handleFile(e.target.files?.[0], processIdentitySelfieFile);
            e.target.value = '';
          }}
        />
      )}
    </>
  );
}
