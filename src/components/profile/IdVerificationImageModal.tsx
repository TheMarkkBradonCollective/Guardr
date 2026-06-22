import React, { useEffect } from 'react';
import { X, ImageOff } from 'lucide-react';

interface IdVerificationImageModalProps {
  label: string;
  imageUrl?: string;
  guardName?: string;
  onClose: () => void;
}

export function IdVerificationImageModal({
  label,
  imageUrl,
  guardName,
  onClose,
}: IdVerificationImageModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[1100] modal-overlay flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="id-verification-image-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg modal-panel max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-brand-border">
          <div className="min-w-0">
            {guardName && <p className="text-xs text-brand-text-muted mb-1">{guardName}</p>}
            <h2 id="id-verification-image-title" className="font-bold text-lg leading-snug">
              {label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-brand-text-muted hover:text-brand-text hover:bg-brand-border/20"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={label}
              className="w-full max-h-[min(70vh,32rem)] object-contain rounded-xl border border-brand-border bg-brand-bg-sec"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 rounded-xl border border-dashed border-brand-border bg-brand-bg-sec text-brand-text-muted">
              <ImageOff className="w-8 h-8 opacity-50" />
              <p className="text-sm">No photo uploaded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface IdVerificationImageThumbProps {
  label: string;
  imageUrl?: string;
  guardName?: string;
  className?: string;
  imageClassName?: string;
  emptyClassName?: string;
}

/** Clickable ID thumbnail — opens full-size view like credential photos. */
export function IdVerificationImageThumb({
  label,
  imageUrl,
  guardName,
  className = '',
  imageClassName = 'w-full h-28 object-cover rounded-lg border border-brand-border bg-brand-bg-sec',
  emptyClassName = 'h-28 rounded-lg border border-dashed border-brand-border bg-brand-bg-sec flex items-center justify-center text-xs text-brand-text-muted px-2 text-center',
}: IdVerificationImageThumbProps) {
  const [open, setOpen] = React.useState(false);

  if (!imageUrl) {
    return (
      <div className={`space-y-1.5 min-w-0 ${className}`}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">{label}</p>
        <div className={emptyClassName}>Not uploaded</div>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-1.5 min-w-0 ${className}`}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">{label}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full text-left group"
          aria-label={`View ${label}`}
        >
          <img src={imageUrl} alt={label} className={`${imageClassName} group-hover:opacity-90 transition-opacity`} />
          <p className="text-[10px] text-brand-primary mt-1">Tap to view</p>
        </button>
      </div>
      {open && (
        <IdVerificationImageModal
          label={label}
          imageUrl={imageUrl}
          guardName={guardName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
