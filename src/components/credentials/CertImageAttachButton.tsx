import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import { processDocumentPhotoFile } from '../../lib/documentPhoto';
import { userFacingError } from '../../lib/userFacingError';

interface CertImageAttachButtonProps {
  onAttach: (imageUrl: string) => Promise<CertImageMutationResult> | CertImageMutationResult;
  compact?: boolean;
}

export function CertImageAttachButton({ onAttach, compact = false }: CertImageAttachButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setUploading(true);
    try {
      const dataUrl = await processDocumentPhotoFile(file);
      const result = await onAttach(dataUrl);
      if (result.ok === false) {
        setError(result.error);
      }
    } catch (err) {
      setError(userFacingError(err, 'Could not read image file. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={
          compact
            ? 'inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline disabled:opacity-60 py-0.5'
            : 'w-full app-button-outline !h-11 !text-sm gap-2 disabled:opacity-50'
        }
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        {uploading ? 'Uploading…' : 'Add photo'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleImageSelect}
      />
      {error && <p className="text-[10px] text-red-400 leading-snug">{error}</p>}
    </div>
  );
}
