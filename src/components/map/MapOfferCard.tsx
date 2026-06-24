import React from 'react';
import { SlideToConfirm } from '../ui/SlideToConfirm';
import { X } from 'lucide-react';

export type MapViewerRole = 'guard' | 'client' | 'staff';

interface MapOfferCardProps {
  summary: React.ReactNode;
  expanded?: boolean;
  onClose: () => void;
  onExpand?: () => void;
  onPrimaryAction?: () => void;
  primaryLabel?: string;
  children?: React.ReactNode;
}

export function MapOfferCard({
  summary,
  expanded = false,
  onClose,
  onExpand,
  onPrimaryAction,
  primaryLabel,
  children,
}: MapOfferCardProps) {
  return (
    <div className={`map-offer-card ${expanded ? 'map-offer-card-expanded' : ''}`}>
      <div className="map-offer-card-handle" aria-hidden />
      <div className="map-offer-card-header">
        <div className="min-w-0 flex-1">{summary}</div>
        <button
          type="button"
          onClick={onClose}
          className="map-offer-card-close shrink-0"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {expanded && children && (
        <div className="map-offer-card-body-scroll mt-3 pr-1 -mr-1">{children}</div>
      )}

      {!expanded && onExpand && (
        <div className="map-offer-card-actions">
          <button type="button" onClick={onExpand} className="app-button-outline app-btn-sm w-full">
            View full job
          </button>
        </div>
      )}

      {onPrimaryAction && primaryLabel && (
        <div className="map-offer-card-slide">
          <SlideToConfirm label={primaryLabel} onConfirm={onPrimaryAction} />
        </div>
      )}
    </div>
  );
}
