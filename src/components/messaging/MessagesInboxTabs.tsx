import React from 'react';

export interface MessagesInboxTab {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface MessagesInboxTabsProps {
  tabs: MessagesInboxTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function MessagesInboxTabs({ tabs, activeTab, onTabChange }: MessagesInboxTabsProps) {
  return (
    <div className="app-inbox-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`app-inbox-tab${activeTab === tab.id ? ' app-inbox-tab-active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon}
          {tab.label}
          {(tab.count ?? 0) > 0 && <span className="app-inbox-tab-badge">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}
