import React, { useState } from 'react';
import { Client } from '../../types';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { Mail, Phone } from 'lucide-react';
import { CLIENT_ACCOUNT_STATUS_LABELS, getClientAccountStatus } from '../../lib/accountStatus';
import { StaffClientApplicationSummary } from './StaffClientApplicationSummary';
import { showAppToast } from '../ui/AppToast';
import { showAppConfirm } from '../ui/AppConfirm';
import {
  confirmApproveClientAccount,
  confirmRestoreAccount,
  confirmSuspendAccount,
} from '../../lib/importantActionConfirm';

interface StaffClientApplicationReviewPanelProps {
  client: Client;
  canManage: boolean;
  onApproveClient: (id: string) => void | Promise<void>;
  onRejectClient: (id: string) => void | Promise<void>;
  onDeleteClient?: (id: string) => void | Promise<void>;
  onOpenClientProfile?: (clientId: string) => void;
}

export function StaffClientApplicationReviewPanel({
  client,
  canManage,
  onApproveClient,
  onRejectClient,
  onDeleteClient,
  onOpenClientProfile,
}: StaffClientApplicationReviewPanelProps) {
  const [deleting, setDeleting] = useState(false);
  const accountStatus = getClientAccountStatus(client);
  const isPending = accountStatus === 'pending';
  const isSuspended = accountStatus === 'suspended';
  const displayName = client.companyName || client.name;
  const statusTone = isPending ? 'warning' : isSuspended ? 'danger' : 'success';

  const handleDelete = async () => {
    if (!onDeleteClient) return;
    if (
      !(await showAppConfirm({
        title: 'Delete client account?',
        message: `Delete client account for ${displayName}? This cannot be undone.`,
        confirmLabel: 'Delete account',
        tone: 'danger',
      }))
    ) {
      return;
    }
    setDeleting(true);
    try {
      await onDeleteClient(client.id);
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not delete client account.', { tone: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleApproveClient = async () => {
    if (!(await confirmApproveClientAccount(displayName))) return;
    onApproveClient(client.id);
  };

  const handleSuspendClient = async () => {
    if (!(await confirmSuspendAccount(displayName, 'client'))) return;
    onRejectClient(client.id);
  };

  const handleRestoreClient = async () => {
    if (!(await confirmRestoreAccount(displayName, 'client'))) return;
    onApproveClient(client.id);
  };

  return (
    <div className="staff-detail-pane space-y-4">
      <div className="flex items-start gap-4 pb-4 border-b border-brand-border">
        <ProfileAvatar src={client.avatar} name={displayName} size="lg" rounded="xl" />
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-lg">{displayName}</h2>
          {client.companyName && client.name !== client.companyName && (
            <p className="text-sm text-brand-text-muted">{client.name}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-brand-text-muted">
            <span className="inline-flex items-center gap-1">
              <Mail className="w-4 h-4" />
              {client.email}
            </span>
            {client.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {client.phone}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <WfBadge tone={statusTone}>{CLIENT_ACCOUNT_STATUS_LABELS[accountStatus]}</WfBadge>
          </div>
        </div>
      </div>

      {onOpenClientProfile && (
        <button
          type="button"
          onClick={() => onOpenClientProfile(client.id)}
          className="text-xs font-semibold text-brand-primary hover:underline"
        >
          View full client profile →
        </button>
      )}

      <StaffClientApplicationSummary client={client} />

      {canManage && (
        <section className="staff-detail-section space-y-2">
          <WfSectionHeader title="Account controls" className="mb-0" />
          <div className="app-action-row--equal">
            {isPending && (
              <button type="button" onClick={() => void handleApproveClient()} className="app-button-primary app-btn-sm">
                Approve client account
              </button>
            )}
            {isSuspended && (
              <button type="button" onClick={() => void handleRestoreClient()} className="app-button-primary app-btn-sm">
                Restore client account
              </button>
            )}
            {!isPending && !isSuspended && (
              <button
                type="button"
                onClick={() => void handleSuspendClient()}
                className="app-button-outline app-btn-sm text-red-400 border-red-500/40"
              >
                Suspend client account
              </button>
            )}
            {onDeleteClient && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="app-button-outline app-btn-sm text-red-400 border-red-500/40"
              >
                {deleting ? 'Deleting…' : 'Delete account'}
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
