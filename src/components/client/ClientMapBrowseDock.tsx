import React, { useState } from 'react';
import { SecurityRequest } from '../../types';
import { clientMapPinKind } from '../../lib/mapJobVisibility';
import { formatShiftRange } from '../../lib/dates';
import { formatCityLabel } from '../../lib/californiaCities';
import { Calendar, MapPin, Plus, UserPlus, X } from 'lucide-react';

interface ClientMapBrowseDockProps {
  jobs: SecurityRequest[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
  onPostJob: () => void;
  onRequestGuard: () => void;
  bottomOffsetClass?: string;
}

const PIN_LABEL: Record<NonNullable<ReturnType<typeof clientMapPinKind>>, string> = {
  upcoming: 'Upcoming',
  past: 'Past',
  cancelled: 'Canceled',
};

export function ClientMapBrowseDock({
  jobs,
  selectedJobId,
  onSelectJob,
  onPostJob,
  onRequestGuard,
  bottomOffsetClass = '',
}: ClientMapBrowseDockProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (selectedJobId) return null;

  return (
    <div className={`client-map-browse-dock ${bottomOffsetClass}`}>
      <div className="client-map-browse-dock-inner">
        <div className="map-offer-card-handle" aria-hidden />

        <div className="client-map-browse-scroll scrollbar-hide">
          <div className="client-map-browse-plus-wrap">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="client-map-browse-plus-card"
              aria-expanded={menuOpen}
              aria-label="Post a job or request a guard"
            >
              <span className="client-map-browse-plus-icon">
                {menuOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </span>
              <span className="client-map-browse-plus-label">
                {menuOpen ? 'Close' : 'New'}
              </span>
            </button>

            {menuOpen && (
              <div className="client-map-browse-plus-menu">
                <button type="button" onClick={onPostJob} className="client-map-browse-plus-action">
                  <Plus className="w-4 h-4" />
                  Post job offer
                </button>
                <button type="button" onClick={onRequestGuard} className="client-map-browse-plus-action">
                  <UserPlus className="w-4 h-4" />
                  Request a guard
                </button>
              </div>
            )}
          </div>

          {jobs.map((job) => {
            const kind = clientMapPinKind(job);
            if (!kind) return null;
            return (
              <button
                key={job.id}
                type="button"
                onClick={() => onSelectJob(job.id)}
                className="client-map-browse-job-card"
              >
                <span className={`client-map-browse-job-chip client-map-browse-job-chip--${kind}`}>
                  {PIN_LABEL[kind]}
                </span>
                <p className="client-map-browse-job-title">{job.title}</p>
                <p className="client-map-browse-job-meta">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{formatCityLabel(job.state) || job.address || job.location}</span>
                </p>
                <p className="client-map-browse-job-meta">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span className="truncate">{formatShiftRange(job.startDate, job.endDate)}</span>
                </p>
              </button>
            );
          })}
        </div>

        {jobs.length === 0 && !menuOpen && (
          <p className="client-map-browse-empty">
            Your past, upcoming, and canceled jobs appear here. Tap <strong>New</strong> to post coverage.
          </p>
        )}
      </div>
    </div>
  );
}
