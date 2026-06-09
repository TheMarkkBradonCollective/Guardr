import React, { useMemo } from 'react';
import { Client, SecurityRequest } from '../../types';
import { formatShiftRange } from '../../lib/dates';
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
    <div className={`staff-ops-card space-y-5 ${compact ? '' : 'h-full'}`}>
      {onBack && (
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-xs font-mono text-brand-primary">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to list
        </button>
      )}

      <div className="flex items-start gap-4">
        <img
          src={client.avatar}
          alt={client.name}
          className="w-16 h-16 rounded-xl object-cover shrink-0"
          referrerPolicy="no-referrer"
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-black text-lg">{client.companyName || client.name}</h2>
          {client.companyName && client.name !== client.companyName && (
            <p className="text-sm text-brand-text-muted">{client.name}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-mono text-brand-text-muted">
            <span className="inline-flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              {client.email}
            </span>
            {client.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {client.phone}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span
              className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                isSuspended ? 'text-red-400 border-red-500/30' : 'text-emerald-400 border-emerald-500/30'
              }`}
            >
              {isSuspended ? 'Suspended' : 'Active'}
            </span>
            {client.rating != null && (
              <span className="text-[10px] font-mono text-brand-text-muted inline-flex items-center gap-1">
                <Star className="w-3 h-3" />
                {client.rating}
              </span>
            )}
          </div>
        </div>
      </div>

      <section className="grid grid-cols-3 gap-2 border-t border-brand-border pt-4">
        <Stat label="Active jobs" value={activeJobs.length} />
        <Stat label="Completed" value={completedJobs.length} />
        <Stat label="Total requests" value={client.totalRequests ?? clientRequests.length} />
      </section>

      <section className="space-y-2 border-t border-brand-border pt-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted">Account controls</p>
        <div className="flex flex-wrap gap-2">
          {isSuspended ? (
            <button type="button" onClick={() => onApproveClient(client.id)} className="staff-ops-btn-primary text-[10px]">
              Restore client account
            </button>
          ) : (
            <button type="button" onClick={() => onRejectClient(client.id)} className="staff-ops-btn-danger text-[10px]">
              Suspend client account
            </button>
          )}
        </div>
      </section>

      <section className="space-y-2 border-t border-brand-border pt-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          Job history
        </p>
        {clientRequests.length === 0 ? (
          <p className="text-xs text-brand-text-muted font-mono">No jobs posted yet.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {clientRequests.slice(0, 12).map((job) => (
              <div key={job.id} className="rounded-lg border border-brand-border/60 px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold truncate">{job.title}</p>
                  <span className="text-[9px] font-mono uppercase text-brand-text-muted shrink-0">
                    {job.status.replace('-', ' ')}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-brand-text-muted mt-0.5">{job.location}</p>
                <p className="text-[10px] text-brand-text-muted">{formatShiftRange(job.startDate, job.endDate)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-brand-border/60 px-3 py-2 text-center">
      <p className="text-lg font-black">{value}</p>
      <p className="text-[9px] font-mono uppercase text-brand-text-muted">{label}</p>
    </div>
  );
}
