import React from 'react';
import { SecurityRequest } from '../../types';
import { isJobScheduleLocked } from '../../lib/jobEditRules';
import { isNoSelfAuditFlagged } from '../../lib/selfAuditPhotos';
import { Camera, Pencil } from 'lucide-react';

interface StaffJobActionsBarProps {
  request: SecurityRequest;
  showEdit: boolean;
  editing: boolean;
  onStartEdit: () => void;
  canUploadAudit: boolean;
  auditUploadOpen: boolean;
  onToggleAuditUpload: () => void;
}

export function StaffJobActionsBar({
  request,
  showEdit,
  editing,
  onStartEdit,
  canUploadAudit,
  auditUploadOpen,
  onToggleAuditUpload,
}: StaffJobActionsBarProps) {
  if (!showEdit && !canUploadAudit) return null;

  const scheduleLocked = isJobScheduleLocked(request);
  const flagged = isNoSelfAuditFlagged(request);

  return (
    <div className="border-t border-brand-border pt-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">Staff actions</p>
      <div className="flex flex-wrap gap-2">
        {showEdit && !editing && (
          <button
            type="button"
            onClick={onStartEdit}
            className="app-button-outline !w-auto !h-9 !px-4 !text-xs"
          >
            <Pencil className="w-3 h-3 inline" />
            {scheduleLocked ? 'Edit title & location' : 'Edit job listing'}
          </button>
        )}
        {canUploadAudit && (
          <button
            type="button"
            onClick={onToggleAuditUpload}
            className={`app-button-outline !w-auto !h-9 !px-4 !text-xs ${
              flagged ? 'border-amber-500/50 text-amber-400' : ''
            }`}
          >
            <Camera className="w-3 h-3 inline" />
            {auditUploadOpen ? 'Hide self-audit upload' : flagged ? 'Upload self-audit photos — required' : 'Upload self-audit photos'}
          </button>
        )}
      </div>
    </div>
  );
}
