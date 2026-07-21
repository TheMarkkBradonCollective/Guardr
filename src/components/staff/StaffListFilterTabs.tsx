import React from 'react';
import { MessagesInboxTabs } from '../messaging/MessagesInboxTabs';

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

/** Status / sort tabs — same underline inbox style as Messages / Support. */
export function StaffListFilterTabs({
  tabs,
  activeId,
  onChange,
  className = '',
  'aria-label': ariaLabel = 'Filter list',
}: StaffListFilterTabsProps) {
  return (
    <div aria-label={ariaLabel}>
      <MessagesInboxTabs
        className={`staff-list-filter-tabs${className ? ` ${className}` : ''}`}
        activeTab={activeId}
        onTabChange={onChange}
        tabs={tabs.map((tab) => ({
          id: tab.id,
          label: tab.label,
          badge: tab.count,
        }))}
      />
    </div>
  );
}
