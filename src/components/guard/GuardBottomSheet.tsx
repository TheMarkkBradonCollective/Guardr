import React, { useEffect, useRef, useState } from 'react';
import { motion, PanInfo } from 'motion/react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { JobCategoryId } from '../../lib/guardJobs';
import { GuardJobsPanelContent } from './GuardJobsPanelContent';
import { useDevice } from '../../lib/platform';

export type SheetSnap = 'peek' | 'half' | 'full';

const SNAP_HEIGHTS: Record<SheetSnap, number> = {
  peek: 0.17,
  half: 0.38,
  full: 0.62,
};

const SNAP_MAX_PX = 520;

interface GuardBottomSheetProps {
  jobs: GuardJobView[];
  guard: SecurityGuard;
  selectedJob: GuardJobView | null;
  selectedCategory: JobCategoryId | null;
  onSelectCategory: (id: JobCategoryId | null) => void;
  onSelectJob: (job: GuardJobView | null) => void;
  onAcceptJob: (jobId: string) => void;
}

function useViewportHeight(): number {
  const [vh, setVh] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  useEffect(() => {
    const update = () => setVh(window.innerHeight);
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);

  return vh;
}

export function GuardBottomSheet({
  jobs,
  guard,
  selectedJob,
  selectedCategory,
  onSelectCategory,
  onSelectJob,
  onAcceptJob,
}: GuardBottomSheetProps) {
  const { formFactor } = useDevice();
  const isSidePanel = formFactor === 'tablet' || formFactor === 'desktop';
  const [snap, setSnap] = useState<SheetSnap>(selectedJob ? 'half' : 'peek');
  const startSnap = useRef<SheetSnap>('peek');
  const vh = useViewportHeight();

  useEffect(() => {
    setSnap(selectedJob ? 'half' : 'peek');
  }, [selectedJob?.id]);

  const cycleSnap = (direction: 'up' | 'down') => {
    const order: SheetSnap[] = ['peek', 'half', 'full'];
    const idx = order.indexOf(snap);
    if (direction === 'up' && idx < order.length - 1) setSnap(order[idx + 1]);
    if (direction === 'down' && idx > 0) setSnap(order[idx - 1]);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -40) cycleSnap('up');
    else if (info.offset.y > 40) cycleSnap('down');
    else setSnap(startSnap.current);
  };

  const sheetLabel = selectedJob
    ? 'Job details'
    : `${jobs.length} available offer${jobs.length === 1 ? '' : 's'}`;

  const panelContent = (
    <GuardJobsPanelContent
      jobs={jobs}
      guard={guard}
      selectedJob={selectedJob}
      selectedCategory={selectedCategory}
      onSelectCategory={onSelectCategory}
      onSelectJob={onSelectJob}
      onAcceptJob={onAcceptJob}
      splitView={isSidePanel}
    />
  );

  if (isSidePanel) {
    return (
      <aside className="guardr-side-panel guard-side-panel">
        <div className="shrink-0 px-4 py-3 border-b border-brand-border">
          <p className="text-xs font-medium text-brand-text-muted">{sheetLabel}</p>
        </div>
        <div className="guard-scroll-panel px-4 py-4 pb-6">{panelContent}</div>
      </aside>
    );
  }

  const heightPx = Math.min(vh * SNAP_HEIGHTS[snap], SNAP_MAX_PX);

  return (
    <motion.div
      className="guardr-bottom-sheet guardr-bottom-sheet-uber rounded-t-2xl"
      style={{ height: heightPx }}
      animate={{ height: heightPx }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
    >
      <div className="flex flex-col h-full">
        <motion.div
          className="shrink-0 touch-none cursor-grab active:cursor-grabbing"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.08}
          onDragStart={() => {
            startSnap.current = snap;
          }}
          onDragEnd={handleDragEnd}
        >
          <button
            type="button"
            className="w-full py-3 flex flex-col items-center"
            onClick={() =>
              setSnap(snap === 'full' ? 'half' : snap === 'half' ? 'peek' : 'full')
            }
            aria-label="Expand or collapse"
          >
            <div className="w-10 h-1 rounded-full sheet-handle mb-2" />
            <span className="text-xs font-medium text-brand-text-muted">{sheetLabel}</span>
          </button>
        </motion.div>

        <div className="guard-scroll-panel flex-1 px-4 pb-6 min-h-0">{panelContent}</div>
      </div>
    </motion.div>
  );
}
