import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';

export type SlideToConfirmTone = 'primary' | 'success' | 'amber';

interface SlideToConfirmProps {
  label: string;
  confirmedLabel?: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  disabledHint?: string;
  tone?: SlideToConfirmTone;
  compact?: boolean;
  className?: string;
}

const THUMB_SIZE = 52;
const THUMB_SIZE_COMPACT = 36;
const TRACK_PADDING = 4;
const CONFIRM_RATIO = 0.86;

const TONE_CLASS: Record<SlideToConfirmTone, string> = {
  primary: 'slide-to-confirm-track-primary',
  success: 'slide-to-confirm-track-success',
  amber: 'slide-to-confirm-track-amber',
};

export function SlideToConfirm({
  label,
  confirmedLabel = 'Done',
  onConfirm,
  disabled = false,
  disabledHint,
  tone = 'primary',
  compact = false,
  className = '',
}: SlideToConfirmProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const dragging = useRef(false);
  const x = useMotionValue(0);

  const thumbSize = compact ? THUMB_SIZE_COMPACT : THUMB_SIZE;
  const maxDrag = Math.max(0, trackWidth - thumbSize - TRACK_PADDING * 2);
  const labelOpacity = useTransform(x, [0, maxDrag * 0.45], [1, 0.15]);
  const chevronOpacity = useTransform(x, [0, maxDrag * 0.3], [0.55, 0]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setTrackWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const snapBack = useCallback(() => {
    animate(x, 0, { type: 'spring', stiffness: 520, damping: 36 });
  }, [x]);

  const tryConfirm = useCallback(async () => {
    if (disabled || busy || confirmed) return;
    const current = x.get();
    if (current < maxDrag * CONFIRM_RATIO) {
      snapBack();
      return;
    }
    setBusy(true);
    animate(x, maxDrag, { type: 'spring', stiffness: 420, damping: 32 });
    try {
      await onConfirm();
      setConfirmed(true);
      window.setTimeout(() => {
        setConfirmed(false);
        x.set(0);
      }, 1400);
    } catch {
      snapBack();
    } finally {
      setBusy(false);
    }
  }, [busy, confirmed, disabled, maxDrag, onConfirm, snapBack, x]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || busy || confirmed) return;
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || disabled || busy || confirmed) return;
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = Math.min(maxDrag, Math.max(0, e.clientX - rect.left - thumbSize / 2 - TRACK_PADDING));
    x.set(next);
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    void tryConfirm();
  };

  return (
    <div className={`slide-to-confirm-root ${className}`.trim()}>
      <div
        ref={trackRef}
        className={`slide-to-confirm-track ${TONE_CLASS[tone]} ${compact ? 'slide-to-confirm-track-compact' : ''} ${disabled ? 'slide-to-confirm-track-disabled' : ''}`}
        aria-disabled={disabled}
      >
        <motion.span className="slide-to-confirm-label" style={{ opacity: labelOpacity }}>
          {confirmed ? confirmedLabel : label}
        </motion.span>
        <motion.span className="slide-to-confirm-chevrons" style={{ opacity: chevronOpacity }} aria-hidden>
          <ChevronRight className="w-4 h-4" />
          <ChevronRight className="w-4 h-4 -ml-2.5" />
        </motion.span>
        <motion.button
          type="button"
          className={`slide-to-confirm-thumb ${compact ? 'slide-to-confirm-thumb-compact' : ''}`}
          style={{ x }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          disabled={disabled || busy || confirmed}
          aria-label={label}
        >
          {confirmed ? (
            <Check className="w-5 h-5" strokeWidth={2.5} />
          ) : (
            <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
          )}
        </motion.button>
      </div>
      {disabled && disabledHint && (
        <p className="slide-to-confirm-hint">{disabledHint}</p>
      )}
    </div>
  );
}
