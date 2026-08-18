import { showAppToast } from '../ui/AppToast';
import { showAppConfirm } from '../ui/AppConfirm';
import {
  confirmApproveClientAccount,
  confirmMarkClientTrusted,
  confirmRemoveClientTrusted,
  confirmRestoreAccount,
  confirmSuspendAccount,
} from '../../lib/importantActionConfirm';
import React, { useMemo, useState } from 'react';
import { Client, SecurityRequest } from '../../types';
import { formatShiftRange } from '../../lib/dates';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { AppButton } from '../ui/AppButton';
import { JobListCard } from '../jobs/JobListCard';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { ArrowLeft, Building2, Mail, Phone, Star } from 'lucide-react';
import { CLIENT_ACCOUNT_STATUS_LABELS, getClientAccountStatus } from '../../lib/accountStatus';
import { StaffClientApplicationSummary } from './StaffClientApplicationSummary';
import { clientAccountKindLabel, clientDisplayName } from '../../lib/clientAccountKind';

interface StaffClientDetailPanelProps {
  client: Client;
  requests: SecurityRequest[];
  canManage: boolean;
  onApproveClient: (id: string) => void;
  onRejectClient: (id: string) => void;
  onDeleteClient?: (id: string) => void | Promise<void>;
  onSetClientTrusted?: (clientId: string, trusted: boolean) => void | Promise<void>;
  onBack?: () => void;
  onOpenJob?: (jobId: string) => void;
  compact?: boolean;
}

export function StaffClientDetailPanel({
  client,
  requests,
  canManage,
  onApproveClient,
  onRejectClient,
  onDeleteClient,
  onSetClientTrusted,
  onBack,
  onOpenJob,
  compact = false,
}: StaffClientDetailPanelProps) {
  const [deleting, setDeleting] = useState(false);
  const accountStatus = getClientAccountStatus(client);
  const isPending = accountStatus === 'pending';
  const isSuspended = accountStatus === 'suspended';

  const clientRequests = useMemo(
    () =>
      requests
        .filter((r) => r.clientId === client.id)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [requests, client.id]
  );

  const activeJobs = clientRequests.filter((r) => ['accepted', 'in-progress', 'open'].includes(r.status));
  const completedJobs = clientRequests.filter((r) => r.status === 'completed');

  const handleDelete = async () => {
    if (!onDeleteClient) return;
    if (!(await showAppConfirm({
      title: 'Delete client account?',
      message: `Delete client account for ${clientDisplayName(client)}? This cannot be undone.`,
      confirmLabel: 'Delete account',
      tone: 'danger',
    }))) {
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

  const displayName = clientDisplayName(client);

  const handleToggleTrusted = async () => {
    if (!onSetClientTrusted) return;
    const confirmed = client.trusted
      ? await confirmRemoveClientTrusted(displayName)
      : await confirmMarkClientTrusted(displayName);
    if (!confirmed) return;
    await onSetClientTrusted(client.id, !client.trusted);
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

  const statusTone = isPending ? 'warning' : isSuspended ? 'danger' : 'success';

  return (
    <div className={`staff-detail-pane space-y-0 ${compact ? '' : 'h-full overflow-y-auto'}`}>
      {onBack && (
        <div className="app-subscreen-header app-subscreen-header--back-only">
          <button type="button" onClick={onBack} className="app-subscreen-back">
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Back to Clients
          </button>
        </div>
      )}

      <div className="flex items-start gap-4 pb-5 border-b border-brand-border">
        <ProfileAvatar
          src={client.avatar}
          name={displayName}
          size="lg"
          rounded="xl"
        />
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
            <WfBadge>{clientAccountKindLabel(client.accountKind)}</WfBadge>
            {client.trusted && <WfBadge tone="primary">Trusted</WfBadge>}
            {client.rating != null && (
              <WfBadge className="inline-flex items-center gap-1">
                <Star className="w-3 h-3" />
                {client.rating}
              </WfBadge>
            )}
          </div>
        </div>
      </div>

      <section className="staff-detail-section grid grid-cols-3 gap-x-4 gap-y-3">
        <div>
          <p className="wf-metric-label">Active jobs</p>
          <p className="wf-metric-value text-brand-primary">{activeJobs.length}</p>
        </div>
        <div>
          <p className="wf-metric-label">Completed</p>
          <p className="wf-metric-value">{completedJobs.length}</p>
        </div>
        <div>
          <p className="wf-metric-label">Total requests</p>
          <p className="wf-metric-value">{client.totalRequests ?? clientRequests.length}</p>
        </div>
      </section>

      {canManage && (
        <section className="staff-detail-section space-y-2">
          <WfSectionHeader title="Account controls" className="mb-0" />
          <div className="staff-detail-actions">
            {isPending && (
              <AppButton variant="primary" size="sm" className="staff-action-btn--ok" onClick={() => void handleApproveClient()}>
                Approve client account
              </AppButton>
            )}
            {isSuspended && (
              <AppButton variant="primary" size="sm" className="staff-action-btn--ok" onClick={() => void handleRestoreClient()}>
                Restore client account
              </AppButton>
            )}
            {!isPending && !isSuspended && (
              <AppButton variant="danger" size="sm" className="staff-action-btn--warn" onClick={() => void handleSuspendClient()}>
                Suspend client account
              </AppButton>
            )}
            {onSetClientTrusted && (
              <AppButton
                variant={client.trusted ? 'outline' : 'primary'}
                size="sm"
                className={client.trusted ? 'staff-action-btn--warn' : 'staff-action-btn--ok'}
                onClick={() => void handleToggleTrusted()}
                title={
                  client.trusted
                    ? 'Remove trusted status — client jobs will require staff approval'
                    : 'Mark as trusted — client jobs skip approval queue'
                }
              >
                {client.trusted ? 'Remove trusted' : 'Mark as trusted'}
              </AppButton>
            )}
            {onDeleteClient && (
              <AppButton
                variant="danger"
                size="sm"
                className="staff-action-btn--danger"
                onClick={() => void handleDelete()}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete account'}
              </AppButton>
            )}
          </div>
        </section>
      )}

      <StaffClientApplicationSummary client={client} />

      <section className="staff-detail-section space-y-2">
        <div className="flex items-center gap-1.5 mb-2">
          <Building2 className="w-4 h-4 text-brand-text-muted" />
          <WfSectionHeader title="Job history" className="mb-0" />
        </div>
        {clientRequests.length === 0 ? (
          <p className="text-sm text-brand-text-muted">No jobs posted yet.</p>
        ) : (
          <>
            {clientRequests.length > 12 && (
              <p className="text-xs text-brand-text-muted mb-2">
                Showing 12 most recent of {clientRequests.length} jobs
              </p>
            )}
            <AppItemCardStack>
              {clientRequests.slice(0, 12).map((job) => (
                <JobListCard
                  key={job.id}
                  job={job}
                  subtitle={job.location}
                  meta={
                    <div className="flex flex-wrap items-center gap-1.5">
                      <WfBadge>{job.status.replace('-', ' ')}</WfBadge>
                      <span>{formatShiftRange(job.startDate, job.endDate)}</span>
                    </div>
                  }
                  onClick={onOpenJob ? () => onOpenJob(job.id) : undefined}
                  showStatus={false}
                />
              ))}
            </AppItemCardStack>
          </>
        )}
      </section>
    </div>
  );
}
