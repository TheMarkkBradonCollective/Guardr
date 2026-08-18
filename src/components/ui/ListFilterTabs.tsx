import React from 'react';
import { MessagesInboxTabs } from '../messaging/MessagesInboxTabs';

export interface ListFilterTab {
  id: string;
  label: string;
  count?: number;
}

export function formatListFilterTabLabel(tab: ListFilterTab): string {
  return tab.label;
}

interface ListFilterTabsProps {
  tabs: ListFilterTab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  'aria-label'?: string;
}

/** Status / sort tabs. Phone restyles these as a segmented control. */
export function ListFilterTabs({
  tabs,
  activeId,
  onChange,
  className = '',
  'aria-label': ariaLabel = 'Filter list',
}: ListFilterTabsProps) {
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
