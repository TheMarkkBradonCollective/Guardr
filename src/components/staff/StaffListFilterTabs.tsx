import React from 'react';

export interface StaffListFilterTab {
  id: string;
  label: string;
  count?: number;
}

export function formatStaffListFilterTabLabel(tab: StaffListFilterTab): string {
  if (tab.count === undefined || tab.count <= 0) return tab.label;
  return `${tab.label} (${tab.count})`;
}

interface StaffListFilterTabsProps {
  tabs: StaffListFilterTab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  'aria-label'?: string;
}

/** Consistent status / sort tabs across staff roster and queue panels. */
export function StaffListFilterTabs({
  tabs,
  activeId,
  onChange,
  className = '',
  'aria-label': ariaLabel = 'Filter list',
}: StaffListFilterTabsProps) {
  return (
    <div
      className={`flex flex-nowrap gap-1.5 staff-list-filter-tabs overflow-x-auto scrollbar-none ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
      style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' } as React.CSSProperties}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeId === tab.id}
          onClick={() => onChange(tab.id)}
          className="staff-filter-pill shrink-0 whitespace-nowrap"
          data-active={activeId === tab.id ? 'true' : undefined}
        >
          {formatStaffListFilterTabLabel(tab)}
        </button>
      ))}
    </div>
  );
}
