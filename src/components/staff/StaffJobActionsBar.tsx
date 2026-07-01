import React from 'react';
import { SecurityRequest } from '../../types';
import { isJobScheduleLocked } from '../../lib/jobEditRules';
import { Pencil } from 'lucide-react';

interface StaffJobActionsBarProps {
  request: SecurityRequest;
  showEdit: boolean;
  editing: boolean;
  onStartEdit: () => void;
}

export function StaffJobActionsBar({
  request,
  showEdit,
  editing,
  onStartEdit,
}: StaffJobActionsBarProps) {
  if (!showEdit) return null;

  const scheduleLocked = isJobScheduleLocked(request);

  return (
    <div className="border-t border-brand-border pt-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">Staff actions</p>
      <div className="app-action-row--equal">
        {!editing && (
          <button
            type="button"
            onClick={onStartEdit}
            className="app-button-outline app-btn-sm"
          >
            <Pencil className="w-3 h-3 inline" />
            {scheduleLocked ? 'Edit title & location' : 'Edit job listing'}
          </button>
        )}
      </div>
    </div>
  );
}
