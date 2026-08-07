import React, { useCallback, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../../../lib/platform/nativeHaptics';

/** Pull distance that arms the refresh. */
const TRIGGER = 72;
/** Hard stop so the indicator never travels past its track. */
const MAX_PULL = 110;

/**
 * Pull-to-refresh for mobile list screens.
 *
 * Only engages when the scroller is already at the top, so it never intercepts a
 * normal upward scroll. The indicator rotates with the pull and spins while the
 * refresh promise is in flight.
 */
export function MobilePullToRefresh({
  onRefresh,
  children,
  disabled = false,
}: {
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ y: number; pointerId: number; armed: boolean } | null>(null);
  const armedRef = useRef(false);

  const run = useCallback(async () => {
    setRefreshing(true);
    setPull(TRIGGER);
    void triggerHaptic('medium');
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setPull(0);
    }
  }, [onRefresh]);

  const onPointerDown = (event: React.PointerEvent) => {
    if (disabled || refreshing) return;
    const atTop = (scrollRef.current?.scrollTop ?? 0) <= 0;
    gesture.current = { y: event.clientY, pointerId: event.pointerId, armed: atTop };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const state = gesture.current;
    if (!state || !state.armed || state.pointerId !== event.pointerId) return;
    const delta = event.clientY - state.y;
    if (delta <= 0) {
      setPull(0);
      return;
    }
    // Rubber-band the pull so the last pixels feel heavier than the first.
    const eased = Math.min(MAX_PULL, delta * 0.55);
    setPull(eased);
    if (eased >= TRIGGER && !armedRef.current) {
      armedRef.current = true;
      void triggerHaptic('light');
    } else if (eased < TRIGGER) {
      armedRef.current = false;
    }
  };

  const onPointerUp = (event: React.PointerEvent) => {
    const state = gesture.current;
    if (!state || state.pointerId !== event.pointerId) return;
    gesture.current = null;
    armedRef.current = false;
    if (pull >= TRIGGER) void run();
    else setPull(0);
  };

  const progress = Math.min(1, pull / TRIGGER);

  return (
    <div className="sfm-ptr">
      <div
        className="sfm-ptr-indicator"
        style={{ transform: `translateY(${pull}px)`, opacity: progress }}
        aria-hidden={pull === 0}
      >
        <RefreshCw
          size={20}
          strokeWidth={2.25}
          className="sfm-ptr-icon"
          data-spinning={refreshing ? 'true' : undefined}
          style={{ transform: refreshing ? undefined : `rotate(${progress * 270}deg)` }}
        />
      </div>
      <div
        className="sfm-ptr-scroll"
        ref={scrollRef}
        data-settling={gesture.current == null ? 'true' : undefined}
        style={{ transform: `translateY(${pull}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {children}
      </div>
    </div>
  );
}
