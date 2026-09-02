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
import { ArrowLeft, Building2, Phone, Star } from 'lucide-react';
import { CLIENT_ACCOUNT_STATUS_LABELS, getClientAccountStatus } from '../../lib/accountStatus';
import { StaffClientApplicationSummary } from './StaffClientApplicationSummary';
import { StaffDetailProfileHeader } from './StaffDetailProfileHeader';
import { StaffAccountAccessSection } from './StaffAccountAccessSection';
import { clientTypeLabel, clientDisplayName } from '../../lib/clientType';

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
      title: 'Delete customer?',
      message: `Delete customer for ${clientDisplayName(client)}? This cannot be undone.`,
      confirmLabel: 'Delete account',
      tone: 'danger',
    }))) {
      return;
    }
    setDeleting(true);
    try {
      await onDeleteClient(client.id);
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not delete customer.', { tone: 'error' });
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

      <StaffDetailProfileHeader
        avatar={
          <ProfileAvatar
            src={client.avatar}
            name={displayName}
            size="lg"
            rounded="xl"
          />
        }
        name={displayName}
        email={client.email}
        metrics={[
          { label: 'Active jobs', value: activeJobs.length, accent: true },
          { label: 'Completed', value: completedJobs.length },
          { label: 'Total requests', value: client.totalRequests ?? clientRequests.length },
        ]}
        badges={
          <>
            <WfBadge tone={statusTone}>{CLIENT_ACCOUNT_STATUS_LABELS[accountStatus]}</WfBadge>
            <WfBadge>{clientTypeLabel(client.clientType)}</WfBadge>
            {client.trusted && <WfBadge tone="primary">Trusted</WfBadge>}
            {client.rating != null && (
              <WfBadge className="inline-flex items-center gap-1">
                <Star className="w-3 h-3" />
                {client.rating}
              </WfBadge>
            )}
          </>
        }
        contact={
          client.phone ? (
            <p className="staff-detail-header-email">
              <Phone className="w-4 h-4 shrink-0" aria-hidden />
              {client.phone}
            </p>
          ) : null
        }
      />

      {canManage && (
        <StaffAccountAccessSection>
            {isPending && (
              <AppButton variant="primary" size="sm" className="staff-action-btn--ok" onClick={() => void handleApproveClient()}>
                Approve customer
              </AppButton>
            )}
            {isSuspended && (
              <AppButton variant="primary" size="sm" className="staff-action-btn--ok" onClick={() => void handleRestoreClient()}>
                Restore customer
              </AppButton>
            )}
            {!isPending && !isSuspended && (
              <AppButton variant="danger" size="sm" className="staff-action-btn--warn" onClick={() => void handleSuspendClient()}>
                Suspend customer
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
                    ? 'Remove trusted status — customer jobs will require staff approval'
                    : 'Mark as trusted — customer jobs skip approval queue'
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
        </StaffAccountAccessSection>
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
