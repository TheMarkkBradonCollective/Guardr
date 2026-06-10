import React from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { NoSelfAuditBadge } from '../jobs/NoSelfAuditBadge';
import { SelfAuditPhotoGallery } from '../jobs/SelfAuditPhotoGallery';
import { isNoSelfAuditFlagged } from '../../lib/selfAuditPhotos';
import { isNoSpotCheckFlagged, isSpotCheckClientConfirmed, sortedSpotChecks } from '../../lib/spotChecks';
import { NoSpotCheckBadge } from '../jobs/NoSpotCheckBadge';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { AppList, AppListRow } from '../ui/app/AppPrimitives';

interface StaffReportsPanelProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
}

export function StaffReportsPanel({ requests, guards }: StaffReportsPanelProps) {
  const withAudits = requests.filter(
    (r) => r.checkInAudit || r.checkOutAudit || (r.spotChecks?.length ?? 0) > 0 || isNoSpotCheckFlagged(r)
  );

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      <p className="text-sm text-brand-text-muted px-4 sm:px-5 pb-4">Job audits, activity logs, and compliance</p>

      {withAudits.length === 0 ? (
        <p className="staff-empty-state border-t border-brand-border">No job reports recorded yet.</p>
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
                    {req.checkInAudit.staffUploadedBy && (
                      <p className="text-xs text-brand-text-muted">
                        Photos uploaded by staff ({req.checkInAudit.staffUploadedBy})
                      </p>
                    )}
                    {req.checkInAudit.clientConfirmedAt && (
                      <p className="text-xs text-emerald-400/90">
                        Client confirmed {new Date(req.checkInAudit.clientConfirmedAt).toLocaleString()}
                        {req.checkInAudit.clientConfirmedBy ? ` (${req.checkInAudit.clientConfirmedBy})` : ''}
                      </p>
                    )}
                    <SelfAuditPhotoGallery audit={req.checkInAudit} />
                  </div>
                )}
                {(isNoSpotCheckFlagged(req) || (req.spotChecks?.length ?? 0) > 0) && (
                  <div className="text-sm bg-brand-bg-sec rounded-xl p-3 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-brand-primary text-xs font-semibold">Staff spot checks</p>
                      {isNoSpotCheckFlagged(req) && <NoSpotCheckBadge />}
                    </div>
                    {isNoSpotCheckFlagged(req) && (
                      <p className="text-xs text-amber-400/90">No spot-check photo on file yet — staff-only, optional but flagged.</p>
                    )}
                    {(req.spotChecks?.length ?? 0) > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {sortedSpotChecks(req).map((check) => (
                          <div key={check.id}>
                            <img
                              src={check.imageUrl}
                              alt="Spot check"
                              className="w-full h-24 object-cover rounded-lg border border-brand-border"
                            />
                            <p className="text-[10px] text-brand-text-muted mt-1">
                              {check.uploadedBy} · {new Date(check.uploadedAt).toLocaleString()}
                              {isSpotCheckClientConfirmed(check) ? (
                                <>
                                  <br />
                                  <span className="text-emerald-400/90">
                                    Client confirmed
                                    {check.clientConfirmedAt ? ` · ${new Date(check.clientConfirmedAt).toLocaleString()}` : ''}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <br />
                                  <span className="text-amber-400/90">Awaiting client confirmation</span>
                                </>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
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
