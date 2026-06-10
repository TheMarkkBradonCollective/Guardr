import React, { useState } from 'react';
import { Certification, SecurityGuard, SecurityRequest } from '../../types';
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { jobPostingTypeLabel } from '../../lib/jobStatus';
import { getOpenJobsWithApplications, guardMeetsJobRequirements, rankApplicantGuards } from '../../lib/jobApplications';
import { getPendingCertifications, getPendingJobApprovals } from '../../lib/staffOps';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { CertDetailModal } from '../credentials/CertDetailModal';
import { JobBillingSummaryFromRequest } from '../jobs/JobBillingSummary';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfBadge, WfListCard, WfSectionHeader } from '../ui/wireframe';
import { Briefcase, Check, Eye, MapPin, Shield, Star, X } from 'lucide-react';

interface StaffApprovalsProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  onApproveRequest: (requestId: string) => void;
  onDenyRequest: (requestId: string) => void;
  onApproveCert: (guardId: string, certId: string) => void;
  onRejectCert: (guardId: string, certId: string) => void;
  onApproveGuardApplication: (requestId: string, guardId: string) => void;
  onViewGuard?: (guardId: string) => void;
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
}: StaffApprovalsProps) {
  const pendingJobs = getPendingJobApprovals(requests);
  const pendingCerts = getPendingCertifications(guards);
  const jobsWithApplications = getOpenJobsWithApplications(requests);
  const [viewCert, setViewCert] = useState<{ guard: SecurityGuard; cert: Certification } | null>(null);
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
              <AppItemCardStack>
                {pendingJobs.map((req) => (
                  <div
                    key={req.id}
                    className="app-item-card app-item-card-align-top flex-col !items-stretch gap-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 w-full">
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
                      </div>
                    </div>
                    <JobBillingSummaryFromRequest req={req} variant="staff" />
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-border w-full">
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
                  </div>
                ))}
              </AppItemCardStack>
            </section>
          )}

          {jobsWithApplications.length > 0 && (
            <section>
              <WfSectionHeader
                title="Guard applications — approve best fit"
                count={jobsWithApplications.reduce((n, job) => n + job.applicants.length, 0)}
              />
              <p className="text-xs text-brand-text-muted mt-1 mb-3">
                Multiple guards can apply to the same open offer. Review applicants and assign the best match.
              </p>
              <AppItemCardStack>
                {jobsWithApplications.map((req) => {
                  const ranked = rankApplicantGuards(req, guards);
                  return (
                    <div
                      key={req.id}
                      className="app-item-card app-item-card-align-top flex-col !items-stretch gap-3"
                    >
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
                      <ul className="space-y-2 border-t border-brand-border pt-3">
                        {ranked.map((guard, index) => {
                          const meets = guardMeetsJobRequirements(guard, req);
                          return (
                            <li
                              key={guard.id}
                              className="flex flex-wrap items-center justify-between gap-3 border border-brand-border rounded-lg px-3 py-2.5"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <ProfileAvatar src={guard.avatar} name={guard.name} size="xs" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {index === 0 ? '★ ' : ''}
                                    {guard.name}
                                  </p>
                                  <p className="text-xs text-brand-text-muted flex items-center gap-2 mt-0.5">
                                    <Star className="w-3 h-3" />
                                    {guard.rating.toFixed(1)} · {guard.jobsCompleted} jobs
                                  </p>
                                  <p className={`text-xs mt-0.5 ${meets ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {meets ? 'Meets job requirements' : 'Missing required credentials'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 shrink-0">
                                {onViewGuard && (
                                  <button
                                    type="button"
                                    onClick={() => onViewGuard(guard.id)}
                                    className="app-button-outline !w-auto !h-8 !px-3 !text-xs"
                                  >
                                    Profile
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onApproveGuardApplication(req.id, guard.id)}
                                  disabled={!meets}
                                  className="app-button-primary !w-auto !h-8 !px-3 !text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  Approve guard
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </AppItemCardStack>
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
