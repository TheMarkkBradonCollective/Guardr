import React from 'react';
import { CheckSquare } from 'lucide-react';

interface StaffBulkActionsBarProps {
  selectedCount: number;
  onApproveAll?: () => void;
  onSuspendAll?: () => void;
  onClearSelection: () => void;
  entityLabel?: string;
}

export function StaffBulkActionsBar({
  selectedCount,
  onApproveAll,
  onSuspendAll,
  onClearSelection,
  entityLabel = 'items',
}: StaffBulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-brand-primary/10 border border-brand-primary/30 rounded-xl mb-4">
      <CheckSquare className="w-5 h-5 text-brand-primary shrink-0" />
      <span className="text-sm font-medium text-brand-text flex-1">
        {selectedCount} {entityLabel} selected
      </span>
      {onApproveAll && (
        <button type="button" onClick={onApproveAll} className="app-button-primary app-btn-sm">
          Approve all
        </button>
      )}
      {onSuspendAll && (
        <button type="button" onClick={onSuspendAll} className="app-button-outline app-btn-sm">
          Suspend all
        </button>
      )}
      <button type="button" onClick={onClearSelection} className="text-sm text-brand-text-muted hover:text-brand-text">
        Clear
      </button>
    </div>
  );
}
