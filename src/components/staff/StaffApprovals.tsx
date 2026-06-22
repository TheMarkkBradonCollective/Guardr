import React, { useEffect, useMemo, useState } from 'react';
import { Certification, Client, PlatformRole, SecurityGuard, SecurityRequest } from '../../types';
import type { ApprovalQueueId } from '../../lib/staffOps';
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { canStaffEditJobTitleAndLocation, isJobScheduleLocked } from '../../lib/jobEditRules';
import { jobPostingTypeLabel } from '../../lib/jobStatus';
import { EditRequestForm } from '../client/EditRequestForm';
import { getOpenJobsWithApplications, guardMeetsJobRequirements, rankApplicantGuards } from '../../lib/jobApplications';
import { getPendingCertifications, getPendingClientAccounts, getPendingJobApprovals } from '../../lib/staffOps';
import {
  getGuardActivationChecklist,
  getPendingGuardAccountReviews,
  guardCanStaffApproveProfile,
  guardActivationSummaryLabel,
} from '../../lib/guardAccountActivation';
import { promptStaffGuardProfileApproval } from '../../lib/guardMissingCredentials';
import { StaffGuardActivationChecklistView } from './StaffGuardActivationChecklistView';
import { GuardMissingCredentialsBadge } from './GuardMissingCredentialsBadge';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { CertDetailModal } from '../credentials/CertDetailModal';
import { CredentialCategoryBadge } from '../credentials/CredentialCategoryBadge';
import { certDisplayName } from '../../lib/certCatalog';
import { certViewSectionLabel, groupPendingCertsByViewSection } from '../../lib/guardCredentialSections';
import { promptStaffResubmitNote } from '../../lib/staffDocumentReview';
import { JobBillingSummaryFromRequest } from '../jobs/JobBillingSummary';
import { AppItemCard, AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfBadge, WfListCard } from '../ui/wireframe';
import { ArrowLeft, Briefcase, Check, ChevronRight, ClipboardCheck, Eye, MapPin, Pencil, Shield, UserCheck, X } from 'lucide-react';

interface StaffApprovalsProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  clients?: Client[];
  onApproveRequest: (requestId: string) => void;
  onDenyRequest: (requestId: string) => void;
  onApproveCert: (guardId: string, certId: string) => void;
  onRejectCert: (guardId: string, certId: string) => void;
  onApproveGuardApplication: (requestId: string, guardId: string) => void;
  onApproveClient?: (clientId: string) => void;
  onApproveGuardAccount?: (guardId: string) => void | Promise<void>;
  onApproveIdentityVerification?: (guardId: string) => void;
  onRejectIdentityVerification?: (guardId: string, reason?: string) => void;
  onRequestIdentityResubmit?: (
    guardId: string,
    slots: import('../../lib/staffDocumentReview').IdVerificationSlot[],
    staffNote?: string
  ) => void;
  onRequestCertImageResubmit?: (guardId: string, certId: string, staffNote?: string) => void;
  onUpdateGuardIdImages?: (
    guardId: string,
    payload: import('../profile/GuardIdentityVerificationPanel').GuardIdentityVerificationPayload
  ) => Promise<import('../profile/GuardIdentityVerificationPanel').IdentityVerificationSubmitResult>;
  onViewGuard?: (guardId: string) => void;
  canEditJobListing?: boolean;
  onEditJobListing?: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
  staffRole?: PlatformRole;
  initialQueue?: ApprovalQueueId | null;
  onQueueChange?: (queue: ApprovalQueueId | null) => void;
}

const QUEUE_META: Record<
  ApprovalQueueId,
  { title: string; description: string; icon: React.ReactNode }
> = {
  'job-offers': {
    title: 'Job offers',
    description: 'Approve before clients can pay',
    icon: <Briefcase className="w-4 h-4" />,
  },
  applications: {
    title: 'Guard applications',
    description: 'Pick the best fit for open jobs',
    icon: <UserCheck className="w-4 h-4" />,
  },
  credentials: {
    title: 'Guard credentials',
    description: 'Verify licenses and certificates',
    icon: <ClipboardCheck className="w-4 h-4" />,
  },
  accounts: {
    title: 'Profile approval',
    description: 'Approve guard and client sign-ups',
    icon: <Shield className="w-4 h-4" />,
  },
};

function ApprovalBackBar({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-start gap-2 mb-4 pb-3 border-b border-brand-border">
      <button type="button" onClick={onBack} className="p-2 -ml-2 text-brand-text" aria-label="Back">
        <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
      </button>
      <div className="min-w-0">
        <h2 className="font-bold text-sm">{title}</h2>
        {subtitle && <p className="text-xs text-brand-text-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export function StaffApprovals({
  requests,
  guards,
  clients = [],
  onApproveRequest,
  onDenyRequest,
  onApproveCert,
  onRejectCert,
  onApproveGuardApplication,
  onApproveClient,
  onApproveGuardAccount,
  onApproveIdentityVerification,
  onRejectIdentityVerification,
  onRequestIdentityResubmit,
  onRequestCertImageResubmit,
  onUpdateGuardIdImages,
  onViewGuard,
  canEditJobListing = false,
  onEditJobListing,
  staffRole,
  initialQueue = null,
  onQueueChange,
}: StaffApprovalsProps) {
  const pendingJobs = getPendingJobApprovals(requests);
  const pendingCerts = getPendingCertifications(guards);
  const pendingGuardAccounts = getPendingGuardAccountReviews(guards);
  const pendingClientAccounts = getPendingClientAccounts(clients);
  const jobsWithApplications = getOpenJobsWithApplications(requests);

  const [activeQueue, setActiveQueue] = useState<ApprovalQueueId | null>(initialQueue);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [viewCert, setViewCert] = useState<{ guard: SecurityGuard; cert: Certification } | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  useEffect(() => {
    setActiveQueue(initialQueue);
    setActiveItemId(null);
  }, [initialQueue]);

  const selectQueue = (queue: ApprovalQueueId | null) => {
    setActiveQueue(queue);
    setActiveItemId(null);
    setEditingJobId(null);
    onQueueChange?.(queue);
  };

  const queueCounts = useMemo(
    () => ({
      'job-offers': pendingJobs.length,
      applications: jobsWithApplications.length,
      credentials: pendingCerts.length,
      accounts: pendingGuardAccounts.length + pendingClientAccounts.length,
    }),
    [
      pendingJobs.length,
      jobsWithApplications.length,
      pendingCerts.length,
      pendingGuardAccounts.length,
      pendingClientAccounts.length,
    ]
  );

  const availableQueues = (Object.keys(QUEUE_META) as ApprovalQueueId[]).filter(
    (id) => queueCounts[id] > 0
  );

  const queueEmpty = availableQueues.length === 0;

  const renderHub = () => (
    <div className="space-y-4">
      {queueEmpty ? (
        <p className="staff-empty-state border border-dashed border-brand-border rounded-xl">
          Nothing waiting for approval.
        </p>
      ) : (
        <AppItemCardStack>
          {availableQueues.map((queueId) => {
            const meta = QUEUE_META[queueId];
            return (
              <AppItemCard key={queueId} onClick={() => selectQueue(queueId)} className="!items-center">
                <span className="staff-overview-action-icon shrink-0">{meta.icon}</span>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{meta.title}</p>
                    <WfBadge tone="warning">{queueCounts[queueId]}</WfBadge>
                  </div>
                  <p className="text-xs text-brand-text-muted mt-1">{meta.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-brand-text-muted shrink-0" />
              </AppItemCard>
            );
          })}
        </AppItemCardStack>
      )}
    </div>
  );

  const renderJobOfferDetail = (req: SecurityRequest) => {
    const showEdit =
      canEditJobListing && onEditJobListing && staffRole && canStaffEditJobTitleAndLocation(req, staffRole);
    const editing = editingJobId === req.id;
    const scheduleLocked = isJobScheduleLocked(req);

    return (
      <div className="staff-detail-pane space-y-3">
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
          <>
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
            <JobBillingSummaryFromRequest req={req} variant="staff" />
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
          </>
        )}
      </div>
    );
  };

  const renderQueueList = () => {
    if (!activeQueue) return null;
    const meta = QUEUE_META[activeQueue];

    if (activeQueue === 'job-offers') {
      if (activeItemId) {
        const req = pendingJobs.find((r) => r.id === activeItemId);
        if (!req) {
          setActiveItemId(null);
          return null;
        }
        return (
          <>
            <ApprovalBackBar title={req.title} subtitle="Job offer review" onBack={() => setActiveItemId(null)} />
            {renderJobOfferDetail(req)}
          </>
        );
      }
      return (
        <>
          <ApprovalBackBar title={meta.title} subtitle={meta.description} onBack={() => selectQueue(null)} />
          <AppItemCardStack>
            {pendingJobs.map((req) => (
              <AppItemCard key={req.id} onClick={() => setActiveItemId(req.id)} className="flex-col !items-stretch gap-1">
                <p className="font-semibold text-sm truncate">{req.title}</p>
                <p className="text-xs text-brand-text-muted truncate">{req.clientName} · {req.location}</p>
                <WfBadge tone="warning" className="mt-1.5 w-fit">Review & approve</WfBadge>
              </AppItemCard>
            ))}
          </AppItemCardStack>
        </>
      );
    }

    if (activeQueue === 'applications') {
      if (activeItemId) {
        const req = jobsWithApplications.find((r) => r.id === activeItemId);
        if (!req) {
          setActiveItemId(null);
          return null;
        }
        const ranked = rankApplicantGuards(req, guards);
        return (
          <>
            <ApprovalBackBar title={req.title} subtitle="Choose a guard for this job" onBack={() => setActiveItemId(null)} />
            <div className="staff-detail-pane space-y-3">
              <p className="text-sm text-brand-text-muted">{req.clientName} · {req.location}</p>
              <div className="space-y-2">
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
                      action={
                        <button
                          type="button"
                          onClick={() => onApproveGuardApplication(req.id, guard.id)}
                          disabled={!meets}
                          className="app-button-primary !w-auto !h-8 !px-3 !text-xs disabled:opacity-40"
                        >
                          Approve guard
                        </button>
                      }
                    />
                  );
                })}
              </div>
            </div>
          </>
        );
      }
      return (
        <>
          <ApprovalBackBar title={meta.title} subtitle={meta.description} onBack={() => selectQueue(null)} />
          <AppItemCardStack>
            {jobsWithApplications.map((req) => (
              <AppItemCard key={req.id} onClick={() => setActiveItemId(req.id)} className="flex-col !items-stretch gap-1">
                <p className="font-semibold text-sm truncate">{req.title}</p>
                <p className="text-xs text-brand-text-muted truncate">
                  {req.applicants.length} applicant{req.applicants.length === 1 ? '' : 's'} · {req.location}
                </p>
              </AppItemCard>
            ))}
          </AppItemCardStack>
        </>
      );
    }

    if (activeQueue === 'credentials') {
      if (activeItemId) {
        const entry = pendingCerts.find(({ cert }) => cert.id === activeItemId);
        if (!entry) {
          setActiveItemId(null);
          return null;
        }
        const { guard, cert } = entry;
        return (
          <>
            <ApprovalBackBar title={`${guard.name} — ${certDisplayName(cert)}`} subtitle="Credential review" onBack={() => setActiveItemId(null)} />
            <div className="staff-detail-pane space-y-4">
              <CredentialCategoryBadge cert={cert} />
              <p className="text-sm text-brand-text-muted">
                {certViewSectionLabel(cert)} · {cert.issuer} · #{cert.number}
                {cert.state ? ` · ${cert.state}` : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setViewCert({ guard, cert })}
                  className="app-button-outline !w-auto !h-9 !px-4 !text-xs gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View document
                </button>
                {onViewGuard && (
                  <button
                    type="button"
                    onClick={() => onViewGuard(guard.id)}
                    className="app-button-outline !w-auto !h-9 !px-4 !text-xs"
                  >
                    Full profile
                  </button>
                )}
                {cert.imageUrl && onRequestCertImageResubmit && (
                  <button
                    type="button"
                    onClick={() => {
                      const note = promptStaffResubmitNote(`${cert.name} photo`);
                      if (note === null) return;
                      onRequestCertImageResubmit(guard.id, cert.id, note);
                      setActiveItemId(null);
                    }}
                    className="app-button-outline !w-auto !h-9 !px-4 !text-xs"
                  >
                    Request clearer photo
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
            </div>
          </>
        );
      }
      const pendingSections = groupPendingCertsByViewSection(pendingCerts, { hideEmpty: true });
      return (
        <>
          <ApprovalBackBar title={meta.title} subtitle={meta.description} onBack={() => selectQueue(null)} />
          <div className="space-y-5">
            {pendingSections.map((section) => (
              <section key={section.id} className="credential-view-section space-y-2">
                <div className="credential-view-section-header">
                  <div>
                    <h3 className="text-sm font-semibold">{section.title}</h3>
                    {section.subtitle && (
                      <p className="text-xs text-brand-text-muted mt-1">{section.subtitle}</p>
                    )}
                  </div>
                  <span className="credential-view-section-count">{section.entries.length}</span>
                </div>
                <AppItemCardStack>
                  {section.entries.map(({ guard, cert }) => (
                    <AppItemCard key={cert.id} onClick={() => setActiveItemId(cert.id)} className="flex-col !items-stretch gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm truncate">{guard.name}</p>
                        <CredentialCategoryBadge cert={cert} variant="category" className="shrink-0" />
                      </div>
                      <p className="text-sm font-medium truncate">{certDisplayName(cert)}</p>
                      <p className="text-xs text-brand-text-muted truncate">{cert.issuer} · #{cert.number}</p>
                    </AppItemCard>
                  ))}
                </AppItemCardStack>
              </section>
            ))}
          </div>
        </>
      );
    }

    if (activeQueue === 'accounts') {
      if (activeItemId) {
        const guard = pendingGuardAccounts.find((g) => g.id === activeItemId) ?? null;
        const client = pendingClientAccounts.find((c) => c.id === activeItemId) ?? null;

        if (guard) {
          return (
            <>
              <ApprovalBackBar title={guard.name} subtitle="Guard profile approval" onBack={() => setActiveItemId(null)} />
              <div className="staff-detail-pane space-y-4">
                <p className="text-sm text-brand-text-muted">{guard.email}</p>
                <StaffGuardActivationChecklistView guard={guard} />
                <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-border">
                  {onViewGuard && (
                    <button type="button" onClick={() => onViewGuard(guard.id)} className="app-button-outline !w-auto !h-9 !px-4 !text-xs">
                      Full profile
                    </button>
                  )}
                  {onApproveGuardAccount && (
                    <button
                      type="button"
                      disabled={!guardCanStaffApproveProfile(guard)}
                      title={
                        guardCanStaffApproveProfile(guard)
                          ? getGuardActivationChecklist(guard).missingWorkCredentials.length > 0
                            ? `Missing: ${getGuardActivationChecklist(guard).missingWorkCredentials.join(', ')} — can still approve`
                            : 'Approve guard profile'
                          : getGuardActivationChecklist(guard).staffApprovalBlockers.join(' · ') ||
                            'Verified government ID required'
                      }
                      onClick={() => {
                        void (async () => {
                          if (!guardCanStaffApproveProfile(guard)) return;
                          if (!promptStaffGuardProfileApproval(guard)) return;
                          try {
                            await onApproveGuardAccount(guard.id);
                            setActiveItemId(null);
                          } catch (err) {
                            alert(err instanceof Error ? err.message : 'Could not approve profile.');
                          }
                        })();
                      }}
                      className="app-button-primary !w-auto !h-9 !px-4 !text-xs gap-1 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve profile
                    </button>
                  )}
                </div>
              </div>
            </>
          );
        }

        if (client) {
          return (
            <>
              <ApprovalBackBar
                title={client.companyName || client.name}
                subtitle="Client account approval"
                onBack={() => setActiveItemId(null)}
              />
              <div className="staff-detail-pane space-y-4">
                <p className="text-sm text-brand-text-muted">{client.email}</p>
                <WfBadge tone="warning">Pending approval</WfBadge>
                {onApproveClient && (
                  <button
                    type="button"
                    onClick={() => {
                      onApproveClient(client.id);
                      setActiveItemId(null);
                    }}
                    className="app-button-primary !w-auto !h-9 !px-4 !text-xs gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve client
                  </button>
                )}
              </div>
            </>
          );
        }

        setActiveItemId(null);
        return null;
      }

      return (
        <>
          <ApprovalBackBar title={meta.title} subtitle={meta.description} onBack={() => selectQueue(null)} />
          <AppItemCardStack>
            {pendingGuardAccounts.map((guard) => (
              <AppItemCard key={guard.id} onClick={() => setActiveItemId(guard.id)} className="flex-col !items-stretch gap-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm truncate">{guard.name}</p>
                  <GuardMissingCredentialsBadge guard={guard} className="shrink-0" />
                </div>
                <p className="text-xs text-brand-text-muted">{guardActivationSummaryLabel(guard)}</p>
              </AppItemCard>
            ))}
            {pendingClientAccounts.map((client) => (
              <AppItemCard key={client.id} onClick={() => setActiveItemId(client.id)} className="flex-col !items-stretch gap-1">
                <p className="font-semibold text-sm truncate">{client.companyName || client.name}</p>
                <p className="text-xs text-brand-text-muted">Client sign-up</p>
              </AppItemCard>
            ))}
          </AppItemCardStack>
        </>
      );
    }

    return null;
  };

  return (
    <div className="animate-fade-in space-y-4">
      <p className="text-sm text-brand-text-muted">
        Review pending job offers, applications, credentials, and account sign-ups. Open a queue to view details and
        approve or decline.
      </p>

      {!activeQueue ? renderHub() : renderQueueList()}

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
