import React, { useRef, useState } from 'react';
import { motion, PanInfo } from 'motion/react';
import { SecurityRequest, SecurityGuard } from '../../types';
import { JOB_CATEGORIES, JobCategoryId } from '../../lib/guardJobs';
import { formatShiftRange } from '../../lib/dates';
import { GuardJobCard } from './GuardJobCard';
import { Calendar, ChevronRight } from 'lucide-react';

export type SheetSnap = 'peek' | 'half' | 'full';

const SNAP_HEIGHTS: Record<SheetSnap, number> = {
  peek: 0.22,
  half: 0.48,
  full: 0.88,
};

interface GuardBottomSheetProps {
  jobs: SecurityRequest[];
  upcomingShifts?: SecurityRequest[];
  guard: SecurityGuard;
  selectedJob: SecurityRequest | null;
  selectedCategory: JobCategoryId | null;
  onSelectCategory: (id: JobCategoryId | null) => void;
  onSelectJob: (job: SecurityRequest | null) => void;
  onAcceptJob: (jobId: string) => void;
}

export function GuardBottomSheet({
  jobs,
  upcomingShifts = [],
  guard,
  selectedJob,
  selectedCategory,
  onSelectCategory,
  onSelectJob,
  onAcceptJob,
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

  const sheetLabel = selectedJob
    ? 'Assignment details'
    : upcomingShifts.length > 0
      ? `${upcomingShifts.length} upcoming · ${jobs.length} available`
      : `${jobs.length} available assignments`;

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
          <div className="w-10 h-1 rounded-full sheet-handle mb-2" />
          <span className="text-xs font-medium text-brand-text-muted">{sheetLabel}</span>
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
            <div className="space-y-5">
              {upcomingShifts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-primary" />
                    <p className="text-sm font-medium text-brand-text-muted">Upcoming assignments</p>
                  </div>
                  {upcomingShifts.map((shift) => (
                    <button
                      key={shift.id}
                      type="button"
                      onClick={() => onSelectJob(shift)}
                      className="w-full text-left rounded-2xl border border-brand-primary/30 bg-brand-primary/8 p-4 hover:bg-brand-primary/12 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{shift.title}</p>
                          <p className="text-sm text-brand-text-muted mt-1 truncate">
                            {formatShiftRange(shift.startDate, shift.endDate)}
                          </p>
                          <p className="text-sm font-medium text-brand-primary mt-1">
                            ${shift.guardPay ?? shift.hourlyRate - 5}/hr
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-brand-primary shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  type="button"
                  onClick={() => onSelectCategory(null)}
                  className={`chip shrink-0 ${!selectedCategory ? 'chip-active' : 'chip-inactive'}`}
                >
                  All
                </button>
                {JOB_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onSelectCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={`chip shrink-0 ${selectedCategory === cat.id ? 'chip-active' : 'chip-inactive'}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-brand-text-muted">Nearby jobs</p>
                {jobs.length === 0 ? (
                  <p className="text-center text-brand-text-muted py-10">No jobs in this category right now.</p>
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
