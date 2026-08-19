import React, { useState } from 'react';
import { Client } from '../../types';
import { clientTypeLabel, clientDisplayName } from '../../lib/clientType';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { Mail, Phone } from 'lucide-react';
import { CLIENT_ACCOUNT_STATUS_LABELS, getClientAccountStatus } from '../../lib/accountStatus';
import { StaffClientApplicationSummary } from './StaffClientApplicationSummary';
import { showAppConfirm } from '../ui/AppConfirm';
import { confirmApproveClientAccount } from '../../lib/importantActionConfirm';
import { promptRequestClientApplicationRevisionNote } from '../../lib/staffDocumentReview';
import { showAppToast } from '../ui/AppToast';

interface StaffClientApplicationReviewPanelProps {
  client: Client;
  canReview: boolean;
  onApproveClient: (id: string) => void | Promise<void>;
  onRejectClient: (id: string) => void | Promise<void>;
  onRequestClientApplicationRevision?: (id: string, reason?: string) => void | Promise<void>;
  onOpenClientProfile?: (clientId: string) => void;
}

export function StaffClientApplicationReviewPanel({
  client,
  canReview,
  onApproveClient,
  onRejectClient,
  onRequestClientApplicationRevision,
  onOpenClientProfile,
}: StaffClientApplicationReviewPanelProps) {
  const [actionPending, setActionPending] = useState(false);
  const accountStatus = getClientAccountStatus(client);
  const isPending = accountStatus === 'pending';
  const isApproved = accountStatus === 'active';
  const displayName = clientDisplayName(client);
  const statusTone = isPending ? 'warning' : accountStatus === 'suspended' ? 'danger' : 'success';

  const handleApproveClient = async () => {
    if (!(await confirmApproveClientAccount(displayName))) return;
    onApproveClient(client.id);
  };

  const handleDenyClient = async () => {
    if (
      !(await showAppConfirm({
        title: 'Deny customer application?',
        message: `${displayName} will not be able to use the platform until restored by staff.`,
        confirmLabel: 'Deny application',
        cancelLabel: 'Keep reviewing',
        tone: 'danger',
      }))
    ) {
      return;
    }
    onRejectClient(client.id);
  };

  const handleRequestRevision = async () => {
    if (!onRequestClientApplicationRevision) return;
    const reason = await promptRequestClientApplicationRevisionNote();
    if (reason === null) return;
    setActionPending(true);
    try {
      await onRequestClientApplicationRevision(client.id, reason);
      showAppToast('Revision requested — application returned to Pending.');
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not request revision.', { tone: 'error' });
    } finally {
      setActionPending(false);
    }
  };

  const handleRevokeClient = async () => {
    if (
      !(await showAppConfirm({
        title: 'Revoke customer application?',
        message: `${displayName} will be suspended and cannot use the platform until restored by staff.`,
        confirmLabel: 'Revoke application',
        cancelLabel: 'Keep approved',
        tone: 'danger',
      }))
    ) {
      return;
    }
    onRejectClient(client.id);
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
            <WfBadge>{clientTypeLabel(client.clientType)}</WfBadge>
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

      {canReview && (isPending || isApproved) && (
        <section className="staff-detail-section space-y-2">
          <WfSectionHeader title="Review actions" className="mb-0" />
          <div className="app-action-row--equal">
            {isPending && (
              <>
                <button
                  type="button"
                  onClick={() => void handleApproveClient()}
                  disabled={actionPending}
                  className="app-button-primary app-btn-sm disabled:opacity-50"
                >
                  Approve application
                </button>
                <button
                  type="button"
                  onClick={() => void handleDenyClient()}
                  disabled={actionPending}
                  className="app-button-outline app-btn-sm text-red-400 border-red-500/40 disabled:opacity-50"
                >
                  Deny application
                </button>
              </>
            )}
            {(isPending || isApproved) && onRequestClientApplicationRevision && (
              <button
                type="button"
                onClick={() => void handleRequestRevision()}
                disabled={actionPending}
                className="app-button-outline app-btn-sm disabled:opacity-50"
              >
                Request revision
              </button>
            )}
            {isApproved && (
              <button
                type="button"
                onClick={() => void handleRevokeClient()}
                disabled={actionPending}
                className="app-button-outline app-btn-sm text-red-400 border-red-500/40 disabled:opacity-50"
              >
                Revoke application
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
