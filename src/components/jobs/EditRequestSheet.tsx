import React from 'react';
import { SecurityRequest } from '../../types';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { EditRequestForm } from '../client/EditRequestForm';

interface EditRequestSheetProps {
  open: boolean;
  request: SecurityRequest | null;
  scheduleLocked?: boolean;
  onSave: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
  onClose: () => void;
}

export function EditRequestSheet({
  open,
  request,
  scheduleLocked = false,
  onSave,
  onClose,
}: EditRequestSheetProps) {
  if (!request) return null;

  const title = scheduleLocked ? 'Edit title & location' : 'Edit job listing';
  const subtitle = scheduleLocked
    ? 'Schedule is locked after payment. Title and location can still be updated.'
    : 'Update listing details, post orders, and site briefing.';

  return (
    <AppFormSheet open={open} onClose={onClose} title={title} subtitle={subtitle}>
      <EditRequestForm
        key={request.id}
        request={request}
        scheduleLocked={scheduleLocked}
        onSave={onSave}
        onCancel={onClose}
        sheet
      />
    </AppFormSheet>
  );
}
