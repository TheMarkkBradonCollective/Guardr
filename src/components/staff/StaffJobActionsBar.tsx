import React from 'react';
import { SecurityRequest } from '../../types';
import { isJobScheduleLocked } from '../../lib/jobEditRules';
import { AppButton } from '../ui/AppButton';
import { WfSectionHeader } from '../ui/wireframe';
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
  if (!showEdit || editing) return null;

  const scheduleLocked = isJobScheduleLocked(request);

  return (
    <section className="staff-detail-section staff-account-access space-y-3">
      <WfSectionHeader title="Staff actions" className="!px-0 !mb-0" />
      <div className="staff-detail-actions staff-detail-actions--primary">
        <AppButton
          variant="primary"
          size="sm"
          fullWidth
          onClick={onStartEdit}
          startEnhancer={<Pencil className="w-3.5 h-3.5" />}
        >
          {scheduleLocked ? 'Edit title & location' : 'Edit job listing'}
        </AppButton>
      </div>
    </section>
  );
}
