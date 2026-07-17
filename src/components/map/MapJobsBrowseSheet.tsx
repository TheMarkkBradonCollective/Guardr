import React from 'react';
import { SecurityRequest } from '../../types';
import { formatShiftRange } from '../../lib/dates';
import { formatCityLabel } from '../../lib/californiaCities';

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
        <p className="uber-section-header" style={{ padding: '10px 20px 4px', fontSize: 16 }}>
          {title}
        </p>
        {jobs.length === 0 ? (
          <p className="text-sm" style={{ padding: '12px 20px', color: 'var(--uber-text-muted)' }}>{emptyMessage}</p>
        ) : (
          <div style={{ maxHeight: '32vh', overflowY: 'auto', overscrollBehavior: 'contain' }}>
            {jobs.map((job) => (
              <button
                key={job.id}
                type="button"
                className="uber-job-row"
                onClick={() => onSelectJob(job.id)}
              >
                <span className="uber-job-row-icon" aria-hidden>
                  <svg width="44" height="28" viewBox="0 0 52 32" fill="none">
                    <rect x="4" y="14" width="44" height="14" rx="5" fill="currentColor" opacity="0.12"/>
                    <rect x="10" y="8" width="32" height="16" rx="5" fill="currentColor" opacity="0.22"/>
                    <circle cx="16" cy="28" r="4" fill="currentColor" opacity="0.55"/>
                    <circle cx="36" cy="28" r="4" fill="currentColor" opacity="0.55"/>
                  </svg>
                </span>
                <span className="uber-job-row-body">
                  <p className="uber-job-row-title">{job.title}</p>
                  <p className="uber-job-row-meta">
                    {formatCityLabel(job.state) || job.address}
                    {' · '}
                    {formatShiftRange(job.startDate, job.endDate)}
                  </p>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
