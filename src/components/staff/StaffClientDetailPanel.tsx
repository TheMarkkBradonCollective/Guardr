import React, { useMemo } from 'react';
import { Client, SecurityRequest } from '../../types';
import { formatShiftRange } from '../../lib/dates';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { JobListCard } from '../jobs/JobListCard';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { ArrowLeft, Building2, Mail, Phone, Star } from 'lucide-react';

interface StaffClientDetailPanelProps {
  client: Client;
  requests: SecurityRequest[];
  onApproveClient: (id: string) => void;
  onRejectClient: (id: string) => void;
  onBack?: () => void;
  onOpenJob?: (jobId: string) => void;
  compact?: boolean;
}

export function StaffClientDetailPanel({
  client,
  requests,
  onApproveClient,
  onRejectClient,
  onBack,
  onOpenJob,
  compact = false,
}: StaffClientDetailPanelProps) {
  const isSuspended = client.approved === false;

  const clientRequests = useMemo(
    () =>
      requests
        .filter((r) => r.clientId === client.id)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [requests, client.id]
  );

  const activeJobs = clientRequests.filter((r) => ['accepted', 'in-progress', 'open'].includes(r.status));
  const completedJobs = clientRequests.filter((r) => r.status === 'completed');

  return (
    <div className={`staff-detail-pane space-y-0 ${compact ? '' : 'h-full overflow-y-auto'}`}>
      {onBack && (
        <div className="px-1 pb-4">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-brand-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to list
          </button>
        </div>
      )}

      <div className="flex items-start gap-4 pb-5 border-b border-brand-border">
        <ProfileAvatar
          src={client.avatar}
          name={client.companyName || client.name}
          size="lg"
          rounded="xl"
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-lg">{client.companyName || client.name}</h2>
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
            <WfBadge tone={isSuspended ? 'danger' : 'success'}>
              {isSuspended ? 'Suspended' : 'Active'}
            </WfBadge>
            {client.rating != null && (
              <WfBadge className="inline-flex items-center gap-1">
                <Star className="w-3 h-3" />
                {client.rating}
              </WfBadge>
            )}
          </div>
        </div>
      </div>

      <section className="grid grid-cols-3 gap-x-4 gap-y-3 py-4 border-b border-brand-border">
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

      <section className="py-4 border-b border-brand-border space-y-2">
        <WfSectionHeader title="Account controls" className="mb-0" />
        <div className="flex flex-wrap gap-2">
          {isSuspended ? (
            <button type="button" onClick={() => onApproveClient(client.id)} className="app-button-primary !w-auto !h-9 !px-4 !text-xs">
              Restore client account
            </button>
          ) : (
            <button type="button" onClick={() => onRejectClient(client.id)} className="app-button-outline !w-auto !h-9 !px-4 !text-xs text-red-400 border-red-500/40">
              Suspend client account
            </button>
          )}
        </div>
      </section>

      <section className="py-4 space-y-2">
        <div className="flex items-center gap-1.5 mb-2">
          <Building2 className="w-4 h-4 text-brand-text-muted" />
          <WfSectionHeader title="Job history" className="mb-0" />
        </div>
        {clientRequests.length === 0 ? (
          <p className="text-sm text-brand-text-muted">No jobs posted yet.</p>
        ) : (
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
        )}
      </section>
    </div>
  );
}
