import React, { useRef, useState } from 'react';
import { motion, PanInfo } from 'motion/react';
import { SecurityRequest, SecurityGuard } from '../../types';
import { JOB_CATEGORIES, JobCategoryId } from '../../lib/guardJobs';
import { GuardJobCard } from './GuardJobCard';

export type SheetSnap = 'peek' | 'half' | 'full';

const SNAP_HEIGHTS: Record<SheetSnap, number> = {
  peek: 0.22,
  half: 0.48,
  full: 0.88,
};

interface GuardBottomSheetProps {
  jobs: SecurityRequest[];
  guard: SecurityGuard;
  selectedJob: SecurityRequest | null;
  selectedCategory: JobCategoryId | null;
  onSelectCategory: (id: JobCategoryId | null) => void;
  onSelectJob: (job: SecurityRequest | null) => void;
  onAcceptJob: (jobId: string) => void;
  isOnline: boolean;
}

export function GuardBottomSheet({
  jobs,
  guard,
  selectedJob,
  selectedCategory,
  onSelectCategory,
  onSelectJob,
  onAcceptJob,
  isOnline,
}: GuardBottomSheetProps) {
  const [snap, setSnap] = useState<SheetSnap>('half');
  const startSnap = useRef<SheetSnap>('half');

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

  const handleDragStart = () => {
    startSnap.current = snap;
  };

  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const heightPx = vh * SNAP_HEIGHTS[snap];

  if (!isOnline) {
    return (
      <div className="guardr-bottom-sheet guardr-bottom-sheet-uber rounded-t-2xl">
        <div className="py-10 text-center">
          <p className="font-black text-base uppercase tracking-tight">Go online to see jobs</p>
          <p className="text-xs text-white/50 mt-2 font-mono">Tap Online in the header to start receiving assignments.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="guardr-bottom-sheet guardr-bottom-sheet-uber rounded-t-2xl"
      style={{ height: heightPx }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.08}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        <button
          type="button"
          className="w-full py-3 flex flex-col items-center shrink-0 touch-none"
          onClick={() => setSnap(snap === 'full' ? 'half' : snap === 'half' ? 'peek' : 'full')}
          aria-label="Expand or collapse"
        >
          <div className="w-10 h-1 rounded-full bg-white/25 mb-1" />
          <span className="text-[10px] font-mono uppercase text-white/40 tracking-widest">
            {selectedJob ? 'Assignment Details' : `${jobs.length} Available Jobs`}
          </span>
        </button>

        <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-0">
          {selectedJob ? (
            <GuardJobCard
              job={selectedJob}
              guard={guard}
              onClose={() => onSelectJob(null)}
              onAccept={() => {
                onAcceptJob(selectedJob.id);
                onSelectJob(null);
              }}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  type="button"
                  onClick={() => onSelectCategory(null)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold font-mono uppercase tracking-wide border transition-colors ${
                    !selectedCategory
                      ? 'bg-brand-primary text-black border-brand-primary'
                      : 'bg-white/5 text-white/60 border-white/10'
                  }`}
                >
                  All
                </button>
                {JOB_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onSelectCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold font-mono uppercase tracking-wide border transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-brand-primary text-black border-brand-primary'
                        : 'bg-white/5 text-white/60 border-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {jobs.length === 0 ? (
                  <p className="text-center text-sm text-white/40 font-mono py-8">No jobs in this category right now.</p>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id}>
                      <GuardJobCard
                        job={job}
                        guard={guard}
                        compact
                        onSelect={() => onSelectJob(job)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
