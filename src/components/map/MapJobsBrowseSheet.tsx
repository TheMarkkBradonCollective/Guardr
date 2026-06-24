import React from 'react';
import { SecurityRequest } from '../../types';
import { formatShiftRange } from '../../lib/dates';
import { formatCityLabel } from '../../lib/californiaCities';
import { MapPin } from 'lucide-react';

interface MapJobsBrowseSheetProps {
  jobs: SecurityRequest[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
  title: string;
  emptyMessage?: string;
  bottomOffsetClass?: string;
}

/** Peek bottom sheet listing map jobs — tap a row or a pin (Sacramentobuynothing-style browse). */
export function MapJobsBrowseSheet({
  jobs,
  selectedJobId,
  onSelectJob,
  title,
  emptyMessage = 'No jobs on the map yet.',
  bottomOffsetClass = '',
}: MapJobsBrowseSheetProps) {
  if (selectedJobId || jobs.length === 0) return null;

  return (
    <div className={`map-jobs-browse-sheet ${bottomOffsetClass}`}>
      <div className="map-offer-card map-jobs-browse-card">
        <div className="map-offer-card-handle" aria-hidden />
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-text-muted mb-2">
          {title}
        </p>
        {jobs.length === 0 ? (
          <p className="text-sm text-brand-text-muted">{emptyMessage}</p>
        ) : (
          <ul className="space-y-1 max-h-[28vh] overflow-y-auto overscroll-contain -mx-1 px-1">
            {jobs.map((job) => (
              <li key={job.id}>
                <button
                  type="button"
                  onClick={() => onSelectJob(job.id)}
                  className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-brand-bg-sec transition-colors"
                >
                  <p className="font-semibold text-sm truncate">{job.title}</p>
                  <p className="text-xs text-brand-text-muted flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {formatCityLabel(job.state) || job.address}
                    <span className="opacity-60">·</span>
                    {formatShiftRange(job.startDate, job.endDate)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
