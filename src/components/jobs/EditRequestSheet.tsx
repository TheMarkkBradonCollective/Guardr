import React from 'react';
import { SecurityRequest } from '../../types';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { EditRequestForm } from '../client/EditRequestForm';

interface EditRequestSheetProps {
  open: boolean;
  request: SecurityRequest | null;
  scheduleLocked?: boolean;
  paidReschedule?: boolean;
  onSave: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
  onClose: () => void;
}

export function EditRequestSheet({
  open,
  request,
  scheduleLocked = false,
  paidReschedule = false,
  onSave,
  onClose,
}: EditRequestSheetProps) {
  if (!request) return null;

  const title = paidReschedule
    ? 'Reschedule shift'
    : scheduleLocked
      ? 'Edit title & location'
      : 'Edit job listing';
  const subtitle = paidReschedule
    ? 'Move start and end within paid hours. Longer shifts and cash jobs need staff approval.'
    : scheduleLocked
      ? 'Schedule is locked after payment. Title and location can still be updated.'
      : 'Update listing details, post orders, and site briefing.';

  return (
    <AppFormSheet open={open} onClose={onClose} title={title} subtitle={subtitle}>
      <EditRequestForm
        key={request.id}
        request={request}
        scheduleLocked={scheduleLocked}
        paidReschedule={paidReschedule}
        onSave={onSave}
        onCancel={onClose}
        sheet
      />
    </AppFormSheet>
  );
}
