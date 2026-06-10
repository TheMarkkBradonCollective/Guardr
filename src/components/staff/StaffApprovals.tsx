import React, { useState } from 'react';
import { Certification, SecurityGuard, SecurityRequest } from '../../types';
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { canEditJobTitleAndLocation, isJobScheduleLocked } from '../../lib/jobEditRules';
import { jobPostingTypeLabel } from '../../lib/jobStatus';
import { EditRequestForm } from '../client/EditRequestForm';
import { getOpenJobsWithApplications, guardMeetsJobRequirements, rankApplicantGuards } from '../../lib/jobApplications';
import { getPendingCertifications, getPendingJobApprovals } from '../../lib/staffOps';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { CertDetailModal } from '../credentials/CertDetailModal';
import { JobBillingSummaryFromRequest } from '../jobs/JobBillingSummary';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfBadge, WfListCard, WfSectionHeader } from '../ui/wireframe';
import { Briefcase, Check, Eye, MapPin, Pencil, Shield, X } from 'lucide-react';

interface StaffApprovalsProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  onApproveRequest: (requestId: string) => void;
  onDenyRequest: (requestId: string) => void;
  onApproveCert: (guardId: string, certId: string) => void;
  onRejectCert: (guardId: string, certId: string) => void;
  onApproveGuardApplication: (requestId: string, guardId: string) => void;
  onViewGuard?: (guardId: string) => void;
  canEditJobListing?: boolean;
  onEditJobListing?: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
}

export function StaffApprovals({
  requests,
  guards,
  onApproveRequest,
  onDenyRequest,
  onApproveCert,
  onRejectCert,
  onApproveGuardApplication,
  onViewGuard,
  canEditJobListing = false,
  onEditJobListing,
}: StaffApprovalsProps) {
  const pendingJobs = getPendingJobApprovals(requests);
  const pendingCerts = getPendingCertifications(guards);
  const jobsWithApplications = getOpenJobsWithApplications(requests);
  const [viewCert, setViewCert] = useState<{ guard: SecurityGuard; cert: Certification } | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const queueEmpty =
    pendingJobs.length === 0 && pendingCerts.length === 0 && jobsWithApplications.length === 0;

  return (
    <div className="animate-fade-in space-y-6">
      <p className="text-sm text-brand-text-muted">
        Approve client job offers before they can pay. Review guard applications and pick the best fit. Verify credentials separately.
      </p>

      {queueEmpty ? (
        <p className="staff-empty-state border border-dashed border-brand-border rounded-xl">
          Nothing waiting for approval.
        </p>
      ) : (
        <>
          {pendingJobs.length > 0 && (
            <section>
              <WfSectionHeader
                title="Job offers — approve before payment"
                count={pendingJobs.length}
              />
              <p className="text-xs text-brand-text-muted mt-1 mb-3">
                Clients cannot pay until staff approves. Approving moves the offer to open so checkout unlocks.
              </p>
              <div className="space-y-6">
                {pendingJobs.map((req) => {
                  const showEdit =
                    canEditJobListing && onEditJobListing && canEditJobTitleAndLocation(req);
                  const editing = editingJobId === req.id;
                  const scheduleLocked = isJobScheduleLocked(req);
                  return (
                  <div key={req.id} className="staff-detail-pane space-y-3 pb-6 border-b border-brand-border last:border-b-0 last:pb-0">
                    {editing ? (
                      <>
                        <JobBillingSummaryFromRequest req={req} variant="staff" />
                        <EditRequestForm
                          request={req}
                          scheduleLocked={scheduleLocked}
                          onSave={async (requestId, updates) => {
                            await onEditJobListing!(requestId, updates);
                            setEditingJobId(null);
                          }}
                          onCancel={() => setEditingJobId(null)}
                        />
                      </>
                    ) : (
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Briefcase className="w-4 h-4 text-brand-primary shrink-0" />
                        <p className="font-semibold text-sm">{req.title}</p>
                        <WfBadge tone="warning">Pending approval</WfBadge>
                        <WfBadge tone="default">{jobPostingTypeLabel(req.requestType)}</WfBadge>
                      </div>
                      <p className="text-sm text-brand-text-muted">{req.clientName}</p>
                      <p className="text-xs text-brand-text-muted mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {req.location}
                      </p>
                      <p className="text-xs text-brand-text-muted mt-0.5">
                        {formatShiftRange(req.startDate, req.endDate)} · {formatDuration(req.durationHours)}
                      </p>
                      {req.description && (
                        <p className="text-xs text-brand-text-muted mt-2 border-l-2 border-brand-primary pl-2 leading-relaxed">
                          {req.description}
                        </p>
                      )}
                      {req.uniformRequirements && (
                        <p className="text-[11px] text-brand-text-muted mt-2">
                          <span className="font-medium text-brand-text">Uniform:</span> {req.uniformRequirements}
                        </p>
                      )}
                      {req.equipmentRequirements && (
                        <p className="text-[11px] text-brand-text-muted mt-1">
                          <span className="font-medium text-brand-text">Equipment:</span> {req.equipmentRequirements}
                        </p>
                      )}
                    </div>
                    )}
                    {!editing && <JobBillingSummaryFromRequest req={req} variant="staff" />}
                    {!editing && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-border w-full">
                      {showEdit && (
                        <button
                          type="button"
                          onClick={() => setEditingJobId(req.id)}
                          className="app-button-outline !w-auto !h-9 !px-4 !text-xs"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit job listing
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDenyRequest(req.id)}
                        className="app-button-outline !w-auto !h-9 !px-4 !text-xs text-red-400 border-red-500/40"
                      >
                        <X className="w-3.5 h-3.5" /> Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => onApproveRequest(req.id)}
                        className="app-button-primary !w-auto !h-9 !px-4 !text-xs"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve — unlock payment
                      </button>
                    </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </section>
          )}

          {jobsWithApplications.length > 0 && (
            <section>
              <WfSectionHeader
                title="Guard applications — pick best fit"
                count={jobsWithApplications.reduce((n, job) => n + job.applicants.length, 0)}
              />
              <p className="text-xs text-brand-text-muted mt-1 mb-3">
                Multiple guards can apply to the same open offer. Review applicants and approve who picks up the job.
              </p>
              <div className="space-y-6">
                {jobsWithApplications.map((req) => {
                  const ranked = rankApplicantGuards(req, guards);
                  return (
                    <div key={req.id} className="staff-detail-pane space-y-3 pb-6 border-b border-brand-border last:border-b-0 last:pb-0">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Shield className="w-4 h-4 text-brand-primary shrink-0" />
                          <p className="font-semibold text-sm">{req.title}</p>
                          <WfBadge tone="primary">{jobPostingTypeLabel(req.requestType)}</WfBadge>
                        </div>
                        <p className="text-sm text-brand-text-muted">{req.clientName} · {req.location}</p>
                        <p className="text-xs text-brand-text-muted mt-0.5">
                          {formatShiftRange(req.startDate, req.endDate)} · {formatDuration(req.durationHours)}
                        </p>
                      </div>
                      <div className="space-y-2 border-t border-brand-border pt-3">
                        {ranked.map((guard, index) => {
                          const meets = guardMeetsJobRequirements(guard, req);
                          return (
                            <WfListCard
                              key={guard.id}
                              avatar={<ProfileAvatar src={guard.avatar} name={guard.name} size="xs" />}
                              title={`${index === 0 ? '★ ' : ''}${guard.name}`}
                              subtitle={`★ ${guard.rating.toFixed(1)} · ${guard.jobsCompleted} jobs`}
                              meta={
                                <span className={meets ? 'text-emerald-400' : 'text-amber-400'}>
                                  {meets ? 'Meets job requirements' : 'Missing required credentials'}
                                </span>
                              }
                              onClick={onViewGuard ? () => onViewGuard(guard.id) : undefined}
                              action={
                                <button
                                  type="button"
                                  onClick={() => onApproveGuardApplication(req.id, guard.id)}
                                  disabled={!meets}
                                  className="app-button-primary !w-auto !h-8 !px-3 !text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  Approve guard
                                </button>
                              }
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {pendingCerts.length > 0 && (
            <section>
              <WfSectionHeader title="Guard credentials" count={pendingCerts.length} />
              <p className="text-xs text-brand-text-muted mt-1 mb-3">
                Review uploaded licenses and certificates — verification is a trust badge only.
              </p>
              <AppItemCardStack>
                {pendingCerts.map(({ guard, cert }) => (
                  <WfListCard
                    key={cert.id}
                    avatar={
                      cert.imageUrl ? (
                        <img
                          src={cert.imageUrl}
                          alt=""
                          className="w-14 h-14 rounded-xl object-cover border border-brand-border"
                        />
                      ) : undefined
                    }
                    title={`${guard.name} — ${cert.name}`}
                    subtitle={`${cert.issuer} · #${cert.number}${cert.state ? ` · ${cert.state}` : ''}`}
                    meta={<span>Expires {cert.expiryDate || '—'}</span>}
                    action={
                      <div className="flex flex-wrap gap-2 shrink-0 justify-end">
                        <button
                          type="button"
                          onClick={() => setViewCert({ guard, cert })}
                          className="app-button-outline !w-auto !h-9 !px-4 !text-xs gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        {onViewGuard && (
                          <button
                            type="button"
                            onClick={() => onViewGuard(guard.id)}
                            className="app-button-outline !w-auto !h-9 !px-4 !text-xs"
                          >
                            Profile
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRejectCert(guard.id, cert.id)}
                          className="app-button-outline !w-auto !h-9 !px-4 !text-xs text-red-400 border-red-500/40"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => onApproveCert(guard.id, cert.id)}
                          className="app-button-primary !w-auto !h-9 !px-4 !text-xs"
                        >
                          <Check className="w-3.5 h-3.5" /> Verify
                        </button>
                      </div>
                    }
                  />
                ))}
              </AppItemCardStack>
            </section>
          )}
        </>
      )}

      {viewCert && (
        <CertDetailModal
          cert={viewCert.cert}
          guardName={viewCert.guard.name}
          onClose={() => setViewCert(null)}
        />
      )}
    </div>
  );
}
