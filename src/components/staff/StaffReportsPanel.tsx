import React from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';

interface StaffReportsPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
}

export function StaffReportsPanel({ requests, guards }: StaffReportsPanelProps) {
  const withAudits = requests.filter((r) => r.checkInAudit || r.checkOutAudit);

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Reports</h1>
        <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase">Shift audits, activity logs, and compliance</p>
      </div>

      {withAudits.length === 0 ? (
        <p className="text-sm text-brand-text-muted font-mono py-12 text-center border border-dashed border-brand-border rounded-xl">
          No shift reports recorded yet.
        </p>
      ) : (
        <div className="space-y-4">
          {withAudits.map((req) => {
            const guard = guards.find((g) => g.id === req.assignedGuardId);
            return (
              <div key={req.id} className="staff-ops-card space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-black text-sm">{req.title}</h3>
                    <p className="text-xs font-mono text-brand-text-muted">{guard?.name ?? 'Guard'} · {req.clientName}</p>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-brand-primary">{req.status}</span>
                </div>
                {req.checkInAudit && (
                  <div className="text-xs bg-black/30 rounded-lg p-3 font-mono space-y-1">
                    <p className="text-brand-primary text-[10px] uppercase">Check-in · {req.checkInAudit.checkedAt}</p>
                    <p>Uniform ✓ · Equipment ✓ · GPS {req.checkInAudit.gpsVerified ? '✓' : '×'}</p>
                  </div>
                )}
                {req.checkOutAudit?.dailyActivityReport && (
                  <div className="text-xs border-l-2 border-brand-primary pl-3">
                    <p className="text-[10px] font-mono uppercase text-brand-text-muted mb-1">Activity Report</p>
                    <p className="text-brand-text-muted italic">"{req.checkOutAudit.dailyActivityReport}"</p>
                  </div>
                )}
                {req.checkOutAudit?.incidentReport?.hasIncident && (
                  <div className="text-xs bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-brand-text-muted font-bold text-[10px] uppercase">Client incident</p>
                    <p className="mt-1">{req.checkOutAudit.incidentReport.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
