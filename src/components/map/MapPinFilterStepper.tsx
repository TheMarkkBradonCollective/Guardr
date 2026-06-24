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
}

export function MapPinFilterStepper<T extends string>({
  filters,
  value,
  onChange,
}: MapPinFilterStepperProps<T>) {
  const currentIndex = Math.max(
    0,
    filters.findIndex((filter) => filter.id === value)
  );
  const current = filters[currentIndex] ?? filters[0];

  const step = (delta: number) => {
    const nextIndex = (currentIndex + delta + filters.length) % filters.length;
    onChange(filters[nextIndex].id);
  };

  return (
    <div className="map-filter-stepper" role="group" aria-label="Map job filter">
      <div className="map-filter-step-controls">
        <button
          type="button"
          className="map-filter-step-btn"
          onClick={() => step(-1)}
          aria-label={`Previous filter: ${filters[(currentIndex - 1 + filters.length) % filters.length].label}`}
        >
          <Minus className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className="map-filter-step-btn"
          onClick={() => step(1)}
          aria-label={`Next filter: ${filters[(currentIndex + 1) % filters.length].label}`}
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>

      <span className="map-filter-step-label">{current.label}</span>
    </div>
  );
}
