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
    <div className={`flex items-center justify-between gap-3 mb-3 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="app-section-title mb-0 truncate">{title}</h2>
        {count != null && (
          <span className="wf-count-badge shrink-0">{count}</span>
        )}
      </div>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="wf-see-all shrink-0">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
