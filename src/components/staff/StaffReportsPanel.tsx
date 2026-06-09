import React from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { AppList, AppListRow } from '../ui/app/AppPrimitives';

interface StaffReportsPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
}

export function StaffReportsPanel({ requests, guards }: StaffReportsPanelProps) {
  const withAudits = requests.filter((r) => r.checkInAudit || r.checkOutAudit);

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      <p className="text-sm text-brand-text-muted px-4 sm:px-5 pb-4">Shift audits, activity logs, and compliance</p>

      {withAudits.length === 0 ? (
        <p className="staff-empty-state border-t border-brand-border">No shift reports recorded yet.</p>
      ) : (
        <AppList>
          {withAudits.map((req) => {
            const guard = guards.find((g) => g.id === req.assignedGuardId);
            return (
              <AppListRow key={req.id} className="flex-col !items-stretch gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2 w-full">
                  <div>
                    <h3 className="font-semibold text-sm">{req.title}</h3>
                    <p className="text-xs text-brand-text-muted">{guard?.name ?? 'Guard'} · {req.clientName}</p>
                  </div>
                  <WfBadge tone="primary">{req.status}</WfBadge>
                </div>
                {req.checkInAudit && (
                  <div className="text-sm bg-brand-bg-sec rounded-xl p-3 space-y-1 w-full">
                    <p className="text-brand-primary text-xs font-semibold">Check-in · {req.checkInAudit.checkedAt}</p>
                    <p>Uniform ✓ · Equipment ✓ · GPS {req.checkInAudit.gpsVerified ? '✓' : '×'}</p>
                  </div>
                )}
                {req.checkOutAudit?.dailyActivityReport && (
                  <div className="text-sm border-l-2 border-brand-primary pl-3 w-full">
                    <WfSectionHeader title="Activity Report" className="mb-1" />
                    <p className="text-brand-text-muted italic">"{req.checkOutAudit.dailyActivityReport}"</p>
                  </div>
                )}
                {req.checkOutAudit?.incidentReport?.hasIncident && (
                  <div className="text-sm bg-red-500/10 border border-red-500/30 rounded-xl p-3 w-full">
                    <p className="text-brand-text-muted font-semibold text-xs">Client incident</p>
                    <p className="mt-1">{req.checkOutAudit.incidentReport.description}</p>
                  </div>
                )}
              </AppListRow>
            );
          })}
        </AppList>
      )}
    </div>
  );
}
