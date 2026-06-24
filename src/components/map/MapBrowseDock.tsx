import React from 'react';
import { Calendar, MapPin } from 'lucide-react';

export type MapBrowseChipVariant =
  | 'upcoming'
  | 'past'
  | 'cancelled'
  | 'available'
  | 'scheduled'
  | 'live'
  | 'open'
  | 'default';

export interface MapBrowseDockItem {
  id: string;
  title: string;
  location: string;
  schedule: string;
  chip: string;
  chipVariant: MapBrowseChipVariant;
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

        <div className="map-browse-scroll scrollbar-hide">
          {leading}

          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="map-browse-job-card"
            >
              <span className={`map-browse-job-chip map-browse-job-chip--${item.chipVariant}`}>
                {item.chip}
              </span>
              <p className="map-browse-job-title">{item.title}</p>
              <p className="map-browse-job-meta">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{item.location}</span>
              </p>
              <p className="map-browse-job-meta">
                <Calendar className="w-3 h-3 shrink-0" />
                <span className="truncate">{item.schedule}</span>
              </p>
            </button>
          ))}
        </div>

        {items.length === 0 && !leading && (
          <p className="map-browse-empty">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}
