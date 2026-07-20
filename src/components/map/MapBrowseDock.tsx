import React from 'react';

export type MapBrowseChipVariant =
  | 'upcoming'
  | 'past'
  | 'cancelled'
  | 'available'
  | 'scheduled'
  | 'live'
  | 'open'
  | 'direct'
  | 'default';

export interface MapBrowseDockItem {
  id: string;
  title: string;
  location: string;
  schedule: string;
  chip: string;
  chipVariant: MapBrowseChipVariant;
  /** Pulse highlight — client requests, next-job urgency, etc. */
  flash?: boolean;
}

interface MapBrowseDockProps {
  items: MapBrowseDockItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyMessage?: string;
  bottomOffsetClass?: string;
  leading?: React.ReactNode;
}

/** Sacramento Buy Nothing-style horizontal browse dock over the map. */
export function MapBrowseDock({
  items,
  selectedId,
  onSelect,
  emptyMessage = 'Jobs on the map appear here.',
  bottomOffsetClass = '',
  leading,
}: MapBrowseDockProps) {
  if (selectedId) return null;

  return (
    <div className={`map-browse-dock ${bottomOffsetClass}`}>
      <div className="map-browse-dock-inner">
        <div className="map-offer-card-handle" aria-hidden />

        {leading ? <div className="map-browse-leading">{leading}</div> : null}

        <div className="map-browse-scroll scrollbar-hide">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`uber-job-row${item.flash ? ' uber-job-row--flash' : ''}`}
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
                <p className="uber-job-row-title">{item.title}</p>
                <p className="uber-job-row-meta">{item.location} · {item.schedule}</p>
              </span>
              <span className="uber-job-row-right">
                <span className={`uber-job-row-badge uber-job-row-badge-${item.chipVariant}`}>
                  {item.chip}
                </span>
              </span>
            </button>
          ))}
        </div>

        {items.length === 0 && (
          <p className="map-browse-empty">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}
