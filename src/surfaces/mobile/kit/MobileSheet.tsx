import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { triggerHaptic } from '../../../lib/platform/nativeHaptics';
import { prefersReducedMotion } from '../../../theme/motionTokens';

export type MobileSheetSnap = 'peek' | 'half' | 'full';

const SNAP_FRACTION: Record<MobileSheetSnap, number> = {
  peek: 0.32,
  half: 0.62,
  full: 0.94,
};

/** Past this fraction of the sheet height a release dismisses instead of settling. */
const DISMISS_FRACTION = 0.32;
/** A fast downward flick dismisses regardless of distance travelled. */
const DISMISS_VELOCITY = 0.7;

export interface MobileSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  /** Snap heights the sheet can rest at. The first is the entry height. */
  snapPoints?: MobileSheetSnap[];
  /** Pinned footer, e.g. a primary confirm button. */
  footer?: React.ReactNode;
  /** Hides the close button when the sheet must be resolved by an action. */
  dismissible?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Bottom sheet — the mobile app's only overlay model.
 *
 * Drags with the finger, snaps between heights, and dismisses on a flick. Nothing
 * on this surface opens a centred dialog; a sheet keeps the content in the thumb
 * zone and keeps the parent screen visible behind it.
 */
export function MobileSheet({
  open,
  onClose,
  title,
  subtitle,
  snapPoints = ['half', 'full'],
  footer,
  dismissible = true,
  children,
  className,
}: MobileSheetProps) {
  const labelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [snapIndex, setSnapIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const drag = useRef<{ startY: number; startTime: number; pointerId: number } | null>(null);

  const snaps = snapPoints.length > 0 ? snapPoints : (['half'] as MobileSheetSnap[]);
  const height = `${Math.round(SNAP_FRACTION[snaps[Math.min(snapIndex, snaps.length - 1)]] * 100)}dvh`;
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (open) {
      setMounted(true);
      setSnapIndex(0);
      setDragOffset(0);
      return;
    }
    setEntered(false);
    if (reduced) {
      setMounted(false);
      return;
    }
    const timer = window.setTimeout(() => setMounted(false), 240);
    return () => window.clearTimeout(timer);
  }, [open, reduced]);

  // Two frames: one to mount at translateY(100%), one to transition to rest.
  useLayoutEffect(() => {
    if (!mounted || !open) return;
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [mounted, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, dismissible, onClose]);

  // Locking the body prevents the screen behind the sheet from rubber-banding.
  useEffect(() => {
    if (!mounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted]);

  const endDrag = useCallback(
    (deltaY: number, elapsed: number) => {
      const panelHeight = panelRef.current?.offsetHeight ?? 1;
      const velocity = elapsed > 0 ? deltaY / elapsed : 0;
      const flicked = velocity > DISMISS_VELOCITY;
      const dragged = deltaY > panelHeight * DISMISS_FRACTION;

      setDragging(false);
      setDragOffset(0);
      drag.current = null;

      if (dismissible && (flicked || dragged)) {
        void triggerHaptic('light');
        onClose();
        return;
      }

      // Upward drags step to the next taller snap point instead of over-scrolling.
      if (deltaY < -48 && snapIndex < snaps.length - 1) {
        setSnapIndex(snapIndex + 1);
        return;
      }
      if (deltaY > 48 && snapIndex > 0) {
        setSnapIndex(snapIndex - 1);
      }
    },
    [dismissible, onClose, snapIndex, snaps.length],
  );

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    drag.current = { startY: event.clientY, startTime: performance.now(), pointerId: event.pointerId };
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const deltaY = event.clientY - state.startY;
    // Resist upward drags so the sheet feels tethered at its tallest snap.
    setDragOffset(deltaY < 0 ? deltaY * 0.35 : deltaY);
  };

  const onPointerUp = (event: React.PointerEvent) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    endDrag(event.clientY - state.startY, performance.now() - state.startTime);
  };

  if (!mounted) return null;

  const settled = entered && open;
  const translate = settled ? `${Math.max(0, dragOffset)}px` : '100%';

  return (
    <div className="sfm-sheet-root" role="presentation">
      <div
        className="sfm-sheet-scrim"
        data-visible={settled ? 'true' : undefined}
        onClick={dismissible ? onClose : undefined}
      />
      <div
        ref={panelRef}
        className={`sfm-sheet${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? labelId : undefined}
        data-dragging={dragging ? 'true' : undefined}
        style={{ height, transform: `translate3d(0, ${translate}, 0)` }}
      >
        <div
          className="sfm-sheet-grip"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="sfm-sheet-handle" aria-hidden />
        </div>

        {title ? (
          <header className="sfm-sheet-head">
            <div className="sfm-sheet-head-text">
              <h2 className="sfm-sheet-title" id={labelId}>
                {title}
              </h2>
              {subtitle ? <p className="sfm-sheet-subtitle">{subtitle}</p> : null}
            </div>
            {dismissible ? (
              <button type="button" className="sfm-sheet-close" onClick={onClose} aria-label="Close">
                <X size={20} strokeWidth={2.25} aria-hidden />
              </button>
            ) : null}
          </header>
        ) : null}

        <div className="sfm-sheet-body" ref={scrollRef}>
          {children}
        </div>

        {footer ? <div className="sfm-sheet-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
