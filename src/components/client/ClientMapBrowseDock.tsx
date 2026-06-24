import React, { useState } from 'react';
import { Plus, UserPlus, X } from 'lucide-react';
import { MapBrowseDock } from '../map/MapBrowseDock';
import { clientMapBrowseItems } from '../../lib/mapBrowseItems';
import { SecurityRequest } from '../../types';

interface ClientMapPostMenuProps {
  onPostJob: () => void;
  onRequestGuard: () => void;
}

export function ClientMapPostMenu({ onPostJob, onRequestGuard }: ClientMapPostMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="map-browse-plus-wrap">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="map-browse-plus-card"
        aria-expanded={menuOpen}
        aria-label="Post a job or request a guard"
      >
        <span className="map-browse-plus-icon">
          {menuOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </span>
        <span className="map-browse-plus-label">{menuOpen ? 'Close' : 'New'}</span>
      </button>

      {menuOpen && (
        <div className="map-browse-plus-menu">
          <button type="button" onClick={onPostJob} className="map-browse-plus-action">
            <Plus className="w-4 h-4" />
            Post job offer
          </button>
          <button type="button" onClick={onRequestGuard} className="map-browse-plus-action">
            <UserPlus className="w-4 h-4" />
            Request a guard
          </button>
        </div>
      )}
    </div>
  );
}

interface ClientMapBrowseDockProps {
  jobs: SecurityRequest[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
  onPostJob: () => void;
  onRequestGuard: () => void;
  bottomOffsetClass?: string;
}

export function ClientMapBrowseDock({
  jobs,
  selectedJobId,
  onSelectJob,
  onPostJob,
  onRequestGuard,
  bottomOffsetClass = '',
}: ClientMapBrowseDockProps) {
  return (
    <MapBrowseDock
      items={clientMapBrowseItems(jobs)}
      selectedId={selectedJobId}
      onSelect={onSelectJob}
      bottomOffsetClass={bottomOffsetClass}
      emptyMessage="Your past, upcoming, and canceled jobs appear here. Tap New to post coverage."
      leading={<ClientMapPostMenu onPostJob={onPostJob} onRequestGuard={onRequestGuard} />}
    />
  );
}
