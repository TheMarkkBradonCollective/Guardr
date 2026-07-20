import React from 'react';

export interface MessagesInboxTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface MessagesInboxTabsProps {
  tabs: MessagesInboxTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function MessagesInboxTabs({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: MessagesInboxTabsProps) {
  return (
    <div className={`app-inbox-tabs${className ? ` ${className}` : ''}`} role="tablist">
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
          <span>{tab.label}</span>
          {typeof tab.badge === 'number' && tab.badge > 0 ? (
            <span className="app-inbox-tab-badge">{tab.badge > 99 ? '99+' : tab.badge}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
