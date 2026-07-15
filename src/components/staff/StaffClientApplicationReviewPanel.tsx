import React from 'react';
import { Client } from '../../types';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { Mail, Phone } from 'lucide-react';
import { CLIENT_ACCOUNT_STATUS_LABELS, getClientAccountStatus } from '../../lib/accountStatus';
import { StaffClientApplicationSummary } from './StaffClientApplicationSummary';
import { showAppConfirm } from '../ui/AppConfirm';
import { confirmApproveClientAccount } from '../../lib/importantActionConfirm';

interface StaffClientApplicationReviewPanelProps {
  client: Client;
  canReview: boolean;
  onApproveClient: (id: string) => void | Promise<void>;
  onRejectClient: (id: string) => void | Promise<void>;
  onOpenClientProfile?: (clientId: string) => void;
}

export function StaffClientApplicationReviewPanel({
  client,
  canReview,
  onApproveClient,
  onRejectClient,
  onOpenClientProfile,
}: StaffClientApplicationReviewPanelProps) {
  const accountStatus = getClientAccountStatus(client);
  const isPending = accountStatus === 'pending';
  const displayName = client.companyName || client.name;
  const statusTone = isPending ? 'warning' : accountStatus === 'suspended' ? 'danger' : 'success';

  const handleApproveClient = async () => {
    if (!(await confirmApproveClientAccount(displayName))) return;
    onApproveClient(client.id);
  };

  const handleDenyClient = async () => {
    if (
      !(await showAppConfirm({
        title: 'Deny client application?',
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

      {canReview && isPending && (
        <section className="staff-detail-section space-y-2">
          <WfSectionHeader title="Review actions" className="mb-0" />
          <div className="app-action-row--equal">
            <button type="button" onClick={() => void handleApproveClient()} className="app-button-primary app-btn-sm">
              Approve application
            </button>
            <button
              type="button"
              onClick={() => void handleDenyClient()}
              className="app-button-outline app-btn-sm text-red-400 border-red-500/40"
            >
              Deny application
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
