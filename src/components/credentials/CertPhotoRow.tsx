import React, { useRef, useState } from 'react';
import { ChevronRight, FileImage, ImagePlus, Loader2 } from 'lucide-react';
import { processDocumentPhotoFile } from '../../lib/documentPhoto';
import { userFacingError } from '../../lib/userFacingError';

export function CertPhotoRow({
  label,
  currentUrl,
  locked,
  onSelect,
}: {
  label: string;
  currentUrl?: string;
  locked: boolean;
  onSelect: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewOpen, setViewOpen] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file || locked) return;
    setError('');
    setLoading(true);
    try {
      const dataUrl = await processDocumentPhotoFile(file);
      onSelect(dataUrl);
    } catch (err) {
      setError(userFacingError(err, 'Could not process image.'));
    } finally {
      setLoading(false);
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
              <FileImage className="w-5 h-5 text-brand-text-muted" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm leading-snug">{label}</p>
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
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="w-full app-button-outline !h-11 !text-sm gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          {loading ? 'Processing…' : currentUrl ? 'Replace photo' : 'Upload photo'}
        </button>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {viewOpen && currentUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setViewOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={currentUrl}
            alt={label}
            className="max-w-full max-h-[85vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={locked}
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </>
  );
}
