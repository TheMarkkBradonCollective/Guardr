import React from 'react';
import { Block } from 'baseui/block';
import { AppModal } from '../ui/motion/AppMotion';

interface DocumentImageLightboxProps {
  open: boolean;
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

/** Full-screen document image viewer. */
export function DocumentImageLightbox({ open, imageUrl, alt, onClose }: DocumentImageLightboxProps) {
  return (
    <AppModal open={open} onClose={onClose} align="center" zIndex={2300} ariaLabelledBy="document-lightbox">
      <Block
        display="flex"
        alignItems="center"
        justifyContent="center"
        padding="scale600"
        onClick={onClose}
        overrides={{
          Block: {
            style: {
              minHeight: '40vh',
              cursor: 'zoom-out',
              backgroundColor: 'var(--brand-bg, #ffffff)',
            },
          },
        }}
      >
        <img
          src={imageUrl}
          alt={alt}
          id="document-lightbox"
          className="max-w-full max-h-[90vh] object-contain rounded-xl border border-brand-border bg-brand-bg"
          onClick={(e) => e.stopPropagation()}
        />
      </Block>
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
        <img
          src={imageUrl}
          alt={alt}
          className={`${className} cursor-zoom-in`}
        />
        <p className="text-[10px] uber-text-accent mt-1.5">Tap to view full size</p>
      </button>
      {!onOpen && (
        <DocumentImageLightbox open={open} imageUrl={imageUrl} alt={alt} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
