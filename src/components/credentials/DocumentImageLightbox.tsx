import React from 'react';
import { X } from 'lucide-react';
import { AppModal } from '../ui/motion/AppMotion';

interface DocumentImageLightboxProps {
  open: boolean;
  imageUrl: string;
  alt: string;
  onClose: () => void;
  fullscreen?: boolean;
}

/** Full-screen document image viewer. */
export function DocumentImageLightbox({
  open,
  imageUrl,
  alt,
  onClose,
  fullscreen = false,
}: DocumentImageLightboxProps) {
  if (fullscreen) {
    return (
      <AppModal
        open={open}
        onClose={onClose}
        align="center"
        zIndex={2300}
        ariaLabelledBy="document-lightbox"
        panelClassName="document-lightbox-panel--fullscreen"
      >
        <div className="document-lightbox-shell" onClick={onClose} role="presentation">
          <button
            type="button"
            className="document-lightbox-close"
            onClick={onClose}
            aria-label="Close full screen image"
          >
            <X className="w-5 h-5" aria-hidden />
          </button>
          <img
            src={imageUrl}
            alt={alt}
            id="document-lightbox"
            className="document-lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </AppModal>
    );
  }

  return (
    <AppModal open={open} onClose={onClose} align="center" zIndex={2300} ariaLabelledBy="document-lightbox">
      <div
        className="document-lightbox-shell"
        style={{ minHeight: '40vh', background: 'var(--brand-bg, #ffffff)', cursor: 'zoom-out' }}
        onClick={onClose}
        role="presentation"
      >
        <img
          src={imageUrl}
          alt={alt}
          id="document-lightbox"
          className="document-lightbox-image"
          style={{ maxHeight: '90vh', borderRadius: '0.75rem', border: '1px solid var(--brand-border)' }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </AppModal>
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
  className = 'w-full max-h-56 object-contain rounded-lg border uber-border uber-bg',
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
        <img src={imageUrl} alt={alt} className={`${className} cursor-zoom-in`} />
        <p className="text-[10px] uber-text-accent mt-1.5">Tap to view full size</p>
      </button>
      {!onOpen ? (
        <DocumentImageLightbox
          open={open}
          imageUrl={imageUrl}
          alt={alt}
          onClose={() => setOpen(false)}
          fullscreen
        />
      ) : null}
    </>
  );
}
