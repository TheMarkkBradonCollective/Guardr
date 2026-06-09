import React, { useMemo } from 'react';
import { Client, SecurityRequest } from '../../types';
import { formatShiftRange } from '../../lib/dates';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfMetricTile, WfSectionHeader } from '../ui/wireframe';
import { AppList, AppListRow } from '../ui/app/AppPrimitives';
import { ArrowLeft, Building2, Mail, Phone, Star } from 'lucide-react';

interface StaffClientDetailPanelProps {
  client: Client;
  requests: SecurityRequest[];
  onApproveClient: (id: string) => void;
  onRejectClient: (id: string) => void;
  onBack?: () => void;
  compact?: boolean;
}

export function StaffClientDetailPanel({
  client,
  requests,
  onApproveClient,
  onRejectClient,
  onBack,
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

      <section className="grid grid-cols-3 gap-2 py-4 border-b border-brand-border">
        <WfMetricTile label="Active jobs" value={activeJobs.length} accent />
        <WfMetricTile label="Completed" value={completedJobs.length} />
        <WfMetricTile label="Total requests" value={client.totalRequests ?? clientRequests.length} />
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
          <AppList>
            {clientRequests.slice(0, 12).map((job) => (
              <AppListRow key={job.id} className="flex-col !items-stretch gap-1">
                <div className="flex items-start justify-between gap-2 w-full">
                  <p className="text-sm font-semibold truncate">{job.title}</p>
                  <WfBadge className="shrink-0">{job.status.replace('-', ' ')}</WfBadge>
                </div>
                <p className="text-xs text-brand-text-muted">{job.location}</p>
                <p className="text-xs text-brand-text-muted">{formatShiftRange(job.startDate, job.endDate)}</p>
              </AppListRow>
            ))}
          </AppList>
        )}
      </section>
    </div>
  );
}
