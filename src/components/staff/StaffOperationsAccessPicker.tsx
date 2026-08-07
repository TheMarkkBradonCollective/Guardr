import React, { useMemo, useState } from 'react';
import { WfSearchBar } from '../ui/wireframe';

interface StaffOperationsAccessPickerProps {
  id?: string;
  cityNames: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  maxListHeightClassName?: string;
  /** When single, staff may only be assigned to one city. */
  mode?: 'single' | 'multiple';
}

function matchesOperationsCitySearch(cityName: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return cityName.toLowerCase().includes(q);
}

export function StaffOperationsAccessPicker({
  id = 'operations-access',
  cityNames,
  selected,
  onChange,
  maxListHeightClassName = 'max-h-48',
  mode = 'multiple',
}: StaffOperationsAccessPickerProps) {
  const [search, setSearch] = useState('');
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(
    () => cityNames.filter((name) => matchesOperationsCitySearch(name, search)),
    [cityNames, search]
  );

  const toggle = (cityName: string) => {
    if (mode === 'single') {
      onChange(selectedSet.has(cityName) ? [] : [cityName]);
      return;
    }
    onChange(
      selectedSet.has(cityName)
        ? selected.filter((city) => city !== cityName)
        : [...selected, cityName]
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-brand-text-muted">
          {selected.length === 0
            ? mode === 'single'
              ? 'No city assigned'
              : 'No Service Areas cities assigned'
            : mode === 'single'
              ? selected[0]
              : `${selected.length} cit${selected.length === 1 ? 'y' : 'ies'} assigned`}
        </p>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs font-medium text-brand-primary hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
      <WfSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search cities..."
        className="w-full"
      />
      <div
        className={`rounded-xl border border-brand-border divide-y divide-brand-border overflow-y-auto ${maxListHeightClassName}`}
      >
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-sm text-brand-text-muted text-center">
            No cities match your search.
          </p>
        ) : (
          filtered.map((cityName) => {
            const checked = selectedSet.has(cityName);
            const inputId = `${id}-${cityName.replace(/\s+/g, '-').toLowerCase()}`;
            return (
              <label
                key={cityName}
                htmlFor={inputId}
                className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-brand-surface/60"
              >
                <input
                  id={inputId}
                  type={mode === 'single' ? 'radio' : 'checkbox'}
                  name={mode === 'single' ? `${id}-city` : undefined}
                  checked={checked}
                  onChange={() => toggle(cityName)}
                  className="rounded border-brand-border"
                />
                <span className="truncate">{cityName}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
