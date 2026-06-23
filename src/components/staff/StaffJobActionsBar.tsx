import React from 'react';
import { SecurityRequest } from '../../types';
import { isJobScheduleLocked } from '../../lib/jobEditRules';
import { isNoSelfAuditFlagged } from '../../lib/selfAuditPhotos';
import { isNoSpotCheckFlagged } from '../../lib/spotChecks';
import { Camera, MapPin, Pencil } from 'lucide-react';

interface StaffJobActionsBarProps {
  request: SecurityRequest;
  showEdit: boolean;
  editing: boolean;
  onStartEdit: () => void;
  canUploadAudit: boolean;
  auditUploadOpen: boolean;
  onToggleAuditUpload: () => void;
  canUploadSpotCheck?: boolean;
  spotCheckOpen?: boolean;
  onToggleSpotCheck?: () => void;
}

export function StaffJobActionsBar({
  request,
  showEdit,
  editing,
  onStartEdit,
  canUploadAudit,
  auditUploadOpen,
  onToggleAuditUpload,
  canUploadSpotCheck = false,
  spotCheckOpen = false,
  onToggleSpotCheck,
}: StaffJobActionsBarProps) {
  if (!showEdit && !canUploadAudit && !canUploadSpotCheck) return null;

  const scheduleLocked = isJobScheduleLocked(request);
  const auditFlagged = isNoSelfAuditFlagged(request);
  const spotCheckFlagged = isNoSpotCheckFlagged(request);

  return (
    <div className="border-t border-brand-border pt-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">Staff actions</p>
      <div className="app-action-row--equal">
        {showEdit && !editing && (
          <button
            type="button"
            onClick={onStartEdit}
            className="app-button-outline app-btn-sm"
          >
            <Pencil className="w-3 h-3 inline" />
            {scheduleLocked ? 'Edit title & location' : 'Edit job listing'}
          </button>
        )}
        {canUploadAudit && (
          <button
            type="button"
            onClick={onToggleAuditUpload}
            className={`app-button-outline app-btn-sm ${
              auditFlagged ? 'border-amber-500/50 text-amber-400' : ''
            }`}
          >
            <Camera className="w-3 h-3 inline" />
            {auditUploadOpen ? 'Hide self-audit upload' : auditFlagged ? 'Upload self-audit photos — required' : 'Upload self-audit photos'}
          </button>
        )}
        {canUploadSpotCheck && onToggleSpotCheck && (
          <button
            type="button"
            onClick={onToggleSpotCheck}
            className={`app-button-outline app-btn-sm ${
              spotCheckFlagged ? 'border-amber-500/50 text-amber-400' : ''
            }`}
          >
            <MapPin className="w-3 h-3 inline" />
            {spotCheckOpen ? 'Hide spot check' : 'Upload spot check'}
          </button>
        )}
      </div>
    </div>
  );
}
