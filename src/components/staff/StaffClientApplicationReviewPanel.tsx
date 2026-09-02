import React, { useState } from 'react';
import { Client } from '../../types';
import { clientTypeLabel, clientDisplayName } from '../../lib/clientType';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge } from '../ui/wireframe';
import { AppButton } from '../ui/AppButton';
import { CLIENT_ACCOUNT_STATUS_LABELS, getClientAccountStatus } from '../../lib/accountStatus';
import { StaffClientApplicationSummary } from './StaffClientApplicationSummary';
import { StaffDetailProfileHeader } from './StaffDetailProfileHeader';
import { StaffAccountAccessSection } from './StaffAccountAccessSection';
import { showAppConfirm } from '../ui/AppConfirm';
import { confirmApproveClientAccount } from '../../lib/importantActionConfirm';
import { promptRequestClientApplicationRevisionNote } from '../../lib/staffDocumentReview';
import { showAppToast } from '../ui/AppToast';
import { User } from 'lucide-react';

interface StaffClientApplicationReviewPanelProps {
  client: Client;
  canReview: boolean;
  onApproveClient: (id: string) => void | Promise<void>;
  onRejectClient: (id: string) => void | Promise<void>;
  onRequestClientApplicationRevision?: (id: string, reason?: string) => void | Promise<void>;
  onOpenClientProfile?: (clientId: string) => void;
  reviewMeta?: React.ReactNode;
}

export function StaffClientApplicationReviewPanel({
  client,
  canReview,
  onApproveClient,
  onRejectClient,
  onRequestClientApplicationRevision,
  onOpenClientProfile,
  reviewMeta,
}: StaffClientApplicationReviewPanelProps) {
  const [actionPending, setActionPending] = useState(false);
  const accountStatus = getClientAccountStatus(client);
  const isPending = accountStatus === 'pending';
  const isApproved = accountStatus === 'active';
  const displayName = clientDisplayName(client);
  const statusTone = isPending ? 'warning' : accountStatus === 'suspended' ? 'danger' : 'success';
  const statusLabel = CLIENT_ACCOUNT_STATUS_LABELS[accountStatus];

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

  const showReviewActions = canReview && (isPending || isApproved);

  return (
    <div className="staff-detail-pane">
      <StaffDetailProfileHeader
        avatar={<ProfileAvatar src={client.avatar} name={displayName} size="lg" rounded="xl" />}
        name={displayName}
        email={client.email}
        metrics={[
          { label: 'Account', value: statusLabel },
          { label: 'Type', value: clientTypeLabel(client.clientType) },
          ...(client.serviceCity
            ? [
                {
                  label: 'Service city',
                  value: client.serviceState
                    ? `${client.serviceCity}, ${client.serviceState}`
                    : client.serviceCity,
                  wide: true,
                },
              ]
            : []),
        ]}
        badges={
          <>
            <WfBadge tone={statusTone}>{statusLabel}</WfBadge>
            <WfBadge>{clientTypeLabel(client.clientType)}</WfBadge>
          </>
        }
      />

      <StaffAccountAccessSection
        title="Application review"
        badge={<WfBadge tone={statusTone}>{statusLabel}</WfBadge>}
        leading={
          onOpenClientProfile ? (
            <AppButton
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => onOpenClientProfile(client.id)}
              startEnhancer={<User className="w-3.5 h-3.5" />}
            >
              View full client profile
            </AppButton>
          ) : undefined
        }
      >
        {showReviewActions ? (
          <>
            {isPending && (
              <>
                <AppButton
                  variant="primary"
                  size="sm"
                  className="staff-action-btn--ok"
                  disabled={actionPending}
                  onClick={() => void handleApproveClient()}
                >
                  Approve application
                </AppButton>
                <AppButton
                  variant="danger"
                  size="sm"
                  className="staff-action-btn--danger"
                  disabled={actionPending}
                  onClick={() => void handleDenyClient()}
                >
                  Deny application
                </AppButton>
              </>
            )}
            {(isPending || isApproved) && onRequestClientApplicationRevision && (
              <AppButton
                variant="outline"
                size="sm"
                className="staff-action-btn--warn"
                disabled={actionPending}
                onClick={() => void handleRequestRevision()}
              >
                Request revision
              </AppButton>
            )}
            {isApproved && (
              <AppButton
                variant="danger"
                size="sm"
                className="staff-action-btn--danger"
                disabled={actionPending}
                onClick={() => void handleRevokeClient()}
              >
                Revoke application
              </AppButton>
            )}
          </>
        ) : null}
      </StaffAccountAccessSection>

      {reviewMeta}

      <StaffClientApplicationSummary client={client} />
    </div>
  );
}
