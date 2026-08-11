import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface DirectContextOption {
  id: string;
  label: string;
}

interface DirectContextSelectProps {
  value: string;
  options: DirectContextOption[];
  onChange?: (id: string) => void;
  'aria-label'?: string;
}

/** Compact org/location selector for Guardr Direct page header (right of title). */
export function DirectContextSelect({
  value,
  options,
  onChange,
  'aria-label': ariaLabel = 'Organization',
}: DirectContextSelectProps) {
  const current = options.find((option) => option.id === value) ?? options[0];

  if (!current || options.length <= 1) {
    return (
      <div className="uber-direct-context-select uber-direct-context-select--static" aria-label={ariaLabel}>
        <span className="uber-direct-context-select-label">{current?.label ?? value}</span>
      </div>
    );
  }

  return (
    <label className="uber-direct-context-select">
      <span className="sr-only">{ariaLabel}</span>
      <select
        className="uber-direct-context-select-control"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        aria-label={ariaLabel}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="uber-direct-context-select-label">{current.label}</span>
      <ChevronDown size={16} aria-hidden className="uber-direct-context-select-chevron" />
    </label>
  );
}
