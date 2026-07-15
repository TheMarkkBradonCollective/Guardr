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

  const runAction = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <div className="client-map-new-fab-wrap">
      {menuOpen && (
        <div className="client-map-new-fab-menu">
          <button type="button" onClick={() => runAction(onPostJob)} className="client-map-new-fab-action">
            <Plus className="w-4 h-4" />
            Post job offer
          </button>
          <button type="button" onClick={() => runAction(onRequestGuard)} className="client-map-new-fab-action">
            <UserPlus className="w-4 h-4" />
            Request a guard
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="client-map-new-fab"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? 'Close new job menu' : 'New job or guard request'}
      >
        {menuOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </button>
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
      emptyMessage="Your completed, scheduled, and canceled jobs appear here. Tap New to post coverage."
      leading={<ClientMapPostMenu onPostJob={onPostJob} onRequestGuard={onRequestGuard} />}
    />
  );
}
