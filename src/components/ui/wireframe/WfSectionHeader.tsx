import React from 'react';

interface WfSectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  count?: number;
  className?: string;
}

export function WfSectionHeader({ title, actionLabel, onAction, count, className = '' }: WfSectionHeaderProps) {
  return (
    <div className={`app-section-head ${className}`}>
      <div className="flex items-center gap-2 min-w-0 !p-0">
        <h2 className="truncate">{title}</h2>
        {count != null && (
          <span className="wf-count-badge shrink-0">{count}</span>
        )}
      </div>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="app-section-link shrink-0">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
