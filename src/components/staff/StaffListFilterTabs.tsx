import React from 'react';

export interface StaffListFilterTab {
  id: string;
  label: string;
  count?: number;
  /** When true, always show (count) even when count is 0 — used for All tabs. */
  alwaysShowCount?: boolean;
}

export function formatStaffListFilterTabLabel(tab: StaffListFilterTab): string {
  if (tab.count === undefined) return tab.label;
  if (tab.alwaysShowCount) return `${tab.label} (${tab.count})`;
  if (tab.count > 0) return `${tab.label} (${tab.count})`;
  return tab.label;
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
