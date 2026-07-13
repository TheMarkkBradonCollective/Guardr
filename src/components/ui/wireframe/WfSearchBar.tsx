import React from 'react';
import { Filter, Search } from 'lucide-react';

interface WfSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
  className?: string;
}

export function WfSearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  onFilterClick,
  className = '',
}: WfSearchBarProps) {
  return (
    <div className={`app-search-bar ${className}`}>
      <Search className="w-4 h-4 shrink-0" />
      <input
        type="search"
        className="app-search-bar-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {onFilterClick && (
        <button
          type="button"
          onClick={onFilterClick}
          className="p-1.5 rounded-full hover:bg-brand-bg-sec text-brand-text-muted hover:text-brand-text transition-colors"
          aria-label="Filter"
        >
          <Filter className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
