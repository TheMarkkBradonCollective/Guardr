import React from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import {
  formatOperationsPhaseLabel,
  openJobRosterGap,
  securityCompanyOperationsRows,
  securityCompanyOperationsSummary,
  upcomingOverflowJobs,
} from '../../lib/securityCompanyOperations';
import { AppButton } from '../ui/AppButton';
import { AppEmptyState, AppScreen, AppSection, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { WfBadge } from '../ui/wireframe';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { formatShiftRange } from '../../lib/dates';
import { Radio, Users } from 'lucide-react';

interface SecurityCompanyOperationsScreenProps {
  clientId: string;
  companyName: string;
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  onOpenJob?: (jobId: string) => void;
  onBack?: () => void;
}

export function SecurityCompanyOperationsScreen({
  clientId,
  companyName,
  requests,
  guards,
  onOpenJob,
  onBack,
}: SecurityCompanyOperationsScreenProps) {
  const summary = securityCompanyOperationsSummary(clientId, requests);
  const rows = securityCompanyOperationsRows(clientId, requests, guards);
  const openJobs = upcomingOverflowJobs(clientId, requests);

  return (
    <AppScreen>
      <AppSubScreenHeader title="Live operations" subtitle={companyName} onBack={onBack} />
      <div className="px-4 pb-8 space-y-4">
        <p className="text-sm text-brand-text-muted leading-relaxed">
          Shift runtime between your company and hired guards — not Guardr staff dispatch. Track
          en-route, on-site, and active posts here.
        </p>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-brand-text">{summary.live}</p>
            <p className="text-[10px] uppercase tracking-wide text-brand-text-muted">On duty</p>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-brand-text">{summary.onSite}</p>
            <p className="text-[10px] uppercase tracking-wide text-brand-text-muted">On site</p>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-brand-text">{summary.scheduled}</p>
            <p className="text-[10px] uppercase tracking-wide text-brand-text-muted">Scheduled</p>
          </div>
        </div>

        <AppSection title="Active & upcoming shifts">
          {rows.length === 0 ? (
            <AppEmptyState
              title="No live shifts"
              message="Accepted and in-progress jobs appear here once guards are en route or on post."
            />
          ) : (
            <div className="space-y-2">
              {rows.map((row, idx) => (
                <div
                  key={`${row.job.id}-${row.slotLabel ?? 'lead'}-${idx}`}
                  className="rounded-xl border border-brand-border bg-brand-surface px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-text">{row.job.title}</p>
                      <p className="text-xs text-brand-text-muted mt-0.5">
                        {formatShiftRange(row.job)}
                        {row.slotLabel ? ` · ${row.slotLabel}` : ''}
                      </p>
                    </div>
                    <WfBadge tone={row.phase === 'on-duty' ? 'primary' : 'warning'}>
                      {formatOperationsPhaseLabel(row.phase)}
                    </WfBadge>
                  </div>
                  {row.guard ? (
                    <div className="flex items-center gap-2 mt-2">
                      <ProfileAvatar src={row.guard.avatar} name={row.guard.name} size="xs" />
                      <span className="text-sm text-brand-text">{row.guard.name}</span>
                      {row.timerLabel && (
                        <span className="text-xs text-brand-primary ml-auto inline-flex items-center gap-1">
                          <Radio className="w-3 h-3" />
                          {row.timerLabel}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-500 mt-2">Awaiting guard assignment</p>
                  )}
                  {onOpenJob && (
                    <div className="mt-2">
                      <AppButton variant="outline" size="sm" onClick={() => onOpenJob(row.job.id)}>
                        Open job
                      </AppButton>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </AppSection>

        <AppSection title="Open overflow posts">
          {openJobs.length === 0 ? (
            <p className="text-xs text-brand-text-muted">No open marketplace posts right now.</p>
          ) : (
            <div className="space-y-2">
              {openJobs.slice(0, 8).map((job) => {
                const gap = openJobRosterGap(job);
                return (
                  <div
                    key={job.id}
                    className="rounded-lg border border-brand-border/80 px-3 py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{job.title}</p>
                      <p className="text-xs text-brand-text-muted">{formatShiftRange(job)}</p>
                    </div>
                    {gap.total > 1 && (
                      <WfBadge tone={gap.open > 0 ? 'warning' : 'primary'}>
                        <Users className="w-3 h-3 inline mr-1" />
                        {gap.filled}/{gap.total}
                      </WfBadge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </AppSection>
      </div>
    </AppScreen>
  );
}
