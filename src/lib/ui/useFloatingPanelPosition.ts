import { useCallback, useLayoutEffect, useState, type RefObject } from 'react';

type PanelAlign = 'left' | 'right';

interface FloatingPanelPosition {
  top: number;
  left?: number;
  right?: number;
}

export function useFloatingPanelPosition(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  align: PanelAlign,
  panelWidth = 352,
) {
  const [position, setPosition] = useState<FloatingPanelPosition>({ top: 0, left: 16, right: 16 });

  const update = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(panelWidth, window.innerWidth - 32);
    const top = rect.bottom + 8;

    if (align === 'left') {
      const left = Math.max(16, Math.min(rect.left, window.innerWidth - width - 16));
      setPosition({ top, left });
      return;
    }

    const right = Math.max(16, window.innerWidth - rect.right);
    const leftEdge = window.innerWidth - right - width;
    if (leftEdge < 16) {
      setPosition({ top, left: 16 });
      return;
    }
    setPosition({ top, right });
  }, [align, panelWidth, triggerRef]);

  useLayoutEffect(() => {
    if (!open) return;
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, update]);

  return position;
}
