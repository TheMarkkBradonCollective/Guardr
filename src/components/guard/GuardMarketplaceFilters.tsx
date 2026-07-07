import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import type { GuardSearchFilters } from '../../lib/guardAvailability';
import { GUARD_SPECIALTY_OPTIONS } from '../../types';

interface GuardMarketplaceFiltersProps {
  filters: GuardSearchFilters;
  onChange: (filters: GuardSearchFilters) => void;
  resultCount?: number;
}

export function GuardMarketplaceFilters({ filters, onChange, resultCount }: GuardMarketplaceFiltersProps) {
  const update = (patch: Partial<GuardSearchFilters>) => onChange({ ...filters, ...patch });

  const hasFilters =
    filters.query ||
    filters.specialties?.length ||
    filters.minRating ||
    filters.armedOnly ||
    filters.trustedOnly ||
    filters.verifiedOnly;

  return (
    <div className="space-y-3 p-4 rounded-xl border border-brand-border bg-brand-surface">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-brand-primary" />
        <span className="text-sm font-semibold text-brand-text">Filters</span>
        {resultCount != null && (
          <span className="text-xs text-brand-text-muted ml-auto">{resultCount} guards</span>
        )}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
        <input
          type="search"
          placeholder="Search by name, badge, specialty…"
          value={filters.query ?? ''}
          onChange={(e) => update({ query: e.target.value || undefined })}
          className="uber-input w-full pl-9 text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={!!filters.armedOnly} onChange={(e) => update({ armedOnly: e.target.checked || undefined })} />
          Armed
        </label>
        <label className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={!!filters.trustedOnly} onChange={(e) => update({ trustedOnly: e.target.checked || undefined })} />
          Trusted
        </label>
        <label className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={!!filters.verifiedOnly} onChange={(e) => update({ verifiedOnly: e.target.checked || undefined })} />
          Verified
        </label>
      </div>
      <select
        value={filters.specialties?.[0] ?? ''}
        onChange={(e) => update({ specialties: e.target.value ? [e.target.value] : undefined })}
        className="uber-input w-full text-sm"
      >
        <option value="">All specialties</option>
        {GUARD_SPECIALTY_OPTIONS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      {hasFilters && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="text-xs text-brand-primary flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Clear filters
        </button>
      )}
    </div>
  );
}
