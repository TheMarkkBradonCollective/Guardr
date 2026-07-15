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
      className={`flex flex-wrap gap-2 staff-list-filter-tabs ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeId === tab.id}
          onClick={() => onChange(tab.id)}
          className={`app-button-outline app-btn-sm ${
            activeId === tab.id ? '!border-brand-primary !text-brand-primary' : ''
          }`}
        >
          {formatStaffListFilterTabLabel(tab)}
        </button>
      ))}
    </div>
  );
}
