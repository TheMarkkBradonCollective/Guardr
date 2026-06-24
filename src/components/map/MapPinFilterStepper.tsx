import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface MapPinFilterOption<T extends string> {
  id: T;
  label: string;
}

interface MapPinFilterStepperProps<T extends string> {
  filters: MapPinFilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  routeSlot?: React.ReactNode;
}

export function MapPinFilterStepper<T extends string>({
  filters,
  value,
  onChange,
  onZoomIn,
  onZoomOut,
  routeSlot,
}: MapPinFilterStepperProps<T>) {
  const currentIndex = Math.max(
    0,
    filters.findIndex((filter) => filter.id === value)
  );
  const current = filters[currentIndex] ?? filters[0];

  const cycleFilter = () => {
    const nextIndex = (currentIndex + 1) % filters.length;
    onChange(filters[nextIndex].id);
  };

  return (
    <div className="map-filter-stepper" role="group" aria-label="Map controls">
      <div className="map-filter-step-controls">
        <button
          type="button"
          className="map-filter-step-btn"
          onClick={onZoomIn}
          aria-label="Zoom in"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className="map-filter-step-btn"
          onClick={onZoomOut}
          aria-label="Zoom out"
        >
          <Minus className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>

      {routeSlot ? <div className="map-route-banner-slot">{routeSlot}</div> : null}

      <div className="map-top-right-cluster">
        <button
          type="button"
          className="map-filter-step-label"
          onClick={cycleFilter}
          aria-label={`Job filter: ${current.label}. Tap to change.`}
        >
          {current.label}
        </button>
      </div>
    </div>
  );
}
