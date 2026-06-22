import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { CERT_DOCUMENT_PHOTO_LABEL } from '../../lib/certImagePolicy';
import { processDocumentPhotoFile } from '../../lib/documentPhoto';

interface DocumentPhotoUploadFieldProps {
  imageUrl?: string;
  onImageUrlChange: (dataUrl: string) => void;
  label?: string;
  previewAlt?: string;
  disabled?: boolean;
  className?: string;
}

/** Form field with a real upload button — not a hidden file input behind a text label. */
export function DocumentPhotoUploadField({
  imageUrl,
  onImageUrlChange,
  label = CERT_DOCUMENT_PHOTO_LABEL,
  previewAlt = 'Document preview',
  disabled = false,
  className = '',
}: DocumentPhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file || disabled) return;
    setError('');
    setLoading(true);
    try {
      onImageUrlChange(await processDocumentPhotoFile(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <p className="uber-label">{label}</p>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={previewAlt}
          className="w-full max-h-40 object-contain rounded-lg border border-brand-border bg-brand-bg-sec"
        />
      )}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => inputRef.current?.click()}
        className="w-full app-button-outline !h-11 !text-sm gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        {loading ? 'Processing…' : imageUrl ? 'Replace photo' : 'Upload photo'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled || loading}
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
