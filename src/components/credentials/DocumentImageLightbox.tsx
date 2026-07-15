import React from 'react';

interface DocumentImageLightboxProps {
  open: boolean;
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

/** Full-screen document image viewer. */
export function DocumentImageLightbox({ open, imageUrl, alt, onClose }: DocumentImageLightboxProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <img
        src={imageUrl}
        alt={alt}
        className="max-w-full max-h-[90vh] object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

interface DocumentImagePreviewProps {
  imageUrl: string;
  alt: string;
  className?: string;
  onOpen?: () => void;
}

/** Clickable credential document preview — opens lightbox on tap. */
export function DocumentImagePreview({
  imageUrl,
  alt,
  className = 'w-full max-h-56 object-contain rounded-lg border border-brand-border bg-brand-bg-sec',
  onOpen,
}: DocumentImagePreviewProps) {
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => {
    if (onOpen) {
      onOpen();
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="block w-full text-left group"
        aria-label={`View full ${alt}`}
      >
        <img
          src={imageUrl}
          alt={alt}
          className={`${className} group-hover:opacity-90 transition-opacity cursor-zoom-in`}
        />
        <p className="text-[10px] text-brand-primary mt-1.5">Tap to view full size</p>
      </button>
      {!onOpen && (
        <DocumentImageLightbox open={open} imageUrl={imageUrl} alt={alt} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
