import React from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { NoSelfAuditBadge } from '../jobs/NoSelfAuditBadge';
import { SelfAuditPhotoGallery } from '../jobs/SelfAuditPhotoGallery';
import { isNoSelfAuditFlagged } from '../../lib/selfAuditPhotos';
import { FileText } from 'lucide-react';
import { buildIncidentReportViews, listIncidentReportsForRequest } from '../../lib/incidentReports';
import { clientViolationCategoryLabel, listClientViolationReports } from '../../lib/clientViolations';
import { IncidentReportDetailView } from '../reports/IncidentReportDetailView';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { AppList, AppListRow } from '../ui/app/AppPrimitives';

interface StaffReportsPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
}

export function StaffReportsPanel({ requests, guards }: StaffReportsPanelProps) {
  const withAudits = requests.filter((r) => r.checkInAudit || r.checkOutAudit);

  return (
    <div className="animate-fade-in min-w-0 max-w-full">
      {withAudits.length === 0 ? (
        <div className="app-empty-state">
          <div className="app-empty-state-icon"><FileText className="w-5 h-5" /></div>
          <p className="app-empty-state-title">No reports yet</p>
          <p className="app-empty-state-body">Guard check-in logs and activity reports from completed jobs will appear here.</p>
        </div>
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
                  <div className="text-sm bg-brand-bg-sec rounded-xl p-3 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-brand-primary text-xs font-semibold">Check-in · {req.checkInAudit.checkedAt}</p>
                      {isNoSelfAuditFlagged(req) && <NoSelfAuditBadge />}
                    </div>
                    <p>Uniform ✓ · Equipment ✓ · GPS {req.checkInAudit.gpsVerified ? '✓' : '×'}</p>
                    {req.checkInAudit.clientConfirmedAt && (
                      <p className="text-xs text-emerald-400/90">
                        Client confirmed {new Date(req.checkInAudit.clientConfirmedAt).toLocaleString()}
                        {req.checkInAudit.clientConfirmedBy ? ` (${req.checkInAudit.clientConfirmedBy})` : ''}
                      </p>
                    )}
                    <SelfAuditPhotoGallery audit={req.checkInAudit} />
                  </div>
                )}
                {req.checkOutAudit?.dailyActivityReport && (
                  <div className="text-sm border-l-2 border-brand-primary pl-3 w-full">
                    <WfSectionHeader title="Activity Report" className="mb-1" />
                    <p className="text-brand-text-muted italic">"{req.checkOutAudit.dailyActivityReport}"</p>
                  </div>
                )}
                {listIncidentReportsForRequest(req).length > 0 && (
                  <div className="text-sm bg-red-500/10 border border-red-500/30 rounded-xl p-3 w-full space-y-3">
                    <p className="text-brand-text-muted font-semibold text-xs">Guard incident report(s)</p>
                    {buildIncidentReportViews([req], guards).map((view, idx) => (
                      <div key={view.id} className={idx > 0 ? 'pt-3 border-t border-red-500/20' : ''}>
                        <IncidentReportDetailView report={view} compact />
                      </div>
                    ))}
                  </div>
                )}
                {listClientViolationReports(req).length > 0 && (
                  <div className="text-sm bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 w-full space-y-2">
                    <p className="text-brand-text-muted font-semibold text-xs">Client violation report(s)</p>
                    {listClientViolationReports(req).map((violation) => (
                      <div key={violation.id} className="text-sm leading-relaxed">
                        <p className="font-semibold">
                          {violation.target === 'guard' ? 'Guard' : 'Job'} ·{' '}
                          {clientViolationCategoryLabel(violation.target, violation.category)}
                        </p>
                        <p className="text-xs text-brand-text-muted">
                          {new Date(violation.reportedAt).toLocaleString()}
                          {violation.reportedByClientName ? ` · ${violation.reportedByClientName}` : ''}
                        </p>
                        <p className="text-brand-text-muted mt-1">{violation.description}</p>
                      </div>
                    ))}
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
