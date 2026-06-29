import { showAppToast } from '../ui/AppToast';
import { SlideToConfirm } from '../ui/SlideToConfirm';
import React, { useEffect, useMemo, useState } from 'react';
import { Certification, Client, PlatformRole, SecurityGuard, SecurityRequest } from '../../types';
import type { ApprovalQueueId } from '../../lib/staffOps';
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { canStaffEditJobTitleAndLocation, isJobScheduleLocked, canStaffReschedulePaidSchedule } from '../../lib/jobEditRules';
import { jobPostingTypeLabel } from '../../lib/jobStatus';
import { EditRequestSheet } from '../jobs/EditRequestSheet';
import { getOpenJobsWithApplications, guardMeetsJobRequirements, rankApplicantGuards } from '../../lib/jobApplications';
import { isAwaitingClientGuardApproval } from '../../lib/guardAssignment';
import { isJobLocationCoordsMissing } from '../../lib/jobLocation';
import { getPendingCertifications, getPendingClientAccounts, getPendingJobApprovals } from '../../lib/staffOps';
import { getPendingScheduleChangeApprovals } from '../../lib/jobScheduleChange';
import {
  getApprovedGuardsAwaitingActivation,
  getGuardActivationChecklist,
  getPendingGuardAccountReviews,
  guardCanStaffActivateAccount,
  guardCanStaffApproveProfile,
  guardActivationSummaryLabel,
} from '../../lib/guardAccountActivation';
import { isGuardAccountApproved } from '../../lib/accountStatus';
import { StaffGuardActivationChecklistView } from './StaffGuardActivationChecklistView';
import { StaffIdReviewSection } from './StaffIdReviewSection';
import { GuardCredentialsPanel } from '../profile/GuardCredentialsPanel';
import { GuardMissingCredentialsBadge } from './GuardMissingCredentialsBadge';
import { GuardRosterStatusBadges } from './GuardRosterStatusBadges';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { CertDetailModal } from '../credentials/CertDetailModal';
import { CredentialCategoryBadge } from '../credentials/CredentialCategoryBadge';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import type { CertUpdatePayload, CertUpdateResult } from '../credentials/CertDetailModal';
import { certDisplayName } from '../../lib/certCatalog';
import { certViewSectionLabel, groupPendingCertsByViewSection } from '../../lib/guardCredentialSections';
import { promptStaffResubmitNote } from '../../lib/staffDocumentReview';
import { staffCanVerifyCertification, staffVerifyCertificationBlocker } from '../../lib/certImagePolicy';
import { NoMapCoordsBadge } from '../jobs/NoMapCoordsBadge';
import { JobBillingSummaryFromRequest } from '../jobs/JobBillingSummary';
import { AppEmptyState, AppItemCard, AppItemCardStack, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { WfBadge, WfListCard } from '../ui/wireframe';
import { Briefcase, Check, ChevronRight, ClipboardCheck, Eye, Globe, MapPin, Pencil, Phone, Shield, UserCheck, X } from 'lucide-react';

interface StaffApprovalsProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  clients?: Client[];
  onApproveRequest: (requestId: string) => void;
  onDenyRequest: (requestId: string) => void;
  onApproveScheduleChange?: (requestId: string) => void | Promise<void>;
  onRejectScheduleChange?: (requestId: string) => void | Promise<void>;
  onApproveScheduleChangeBilling?: (requestId: string) => void | Promise<void>;
  onApproveCert: (guardId: string, certId: string) => void;
  onRejectCert: (guardId: string, certId: string) => void;
  onApproveGuardApplication: (requestId: string, guardId: string) => void;
  onDenyGuardApplication?: (requestId: string, guardId: string) => void | Promise<void>;
  onApproveClient?: (clientId: string) => void;
  onApproveGuardAccount?: (guardId: string) => void | Promise<void>;
  onActivateGuardAccount?: (
    guardId: string,
    options?: import('../../lib/guardMissingCredentials').ActivateGuardAccountOptions
  ) => void | Promise<void>;
  onApproveIdentityVerification?: (guardId: string) => void | Promise<void>;
  onRejectIdentityVerification?: (guardId: string, reason?: string) => void;
  onRequestIdentityResubmit?: (
    guardId: string,
    slots: import('../../lib/staffDocumentReview').IdVerificationSlot[],
    staffNote?: string
  ) => void;
  onRequestCertImageResubmit?: (guardId: string, certId: string, staffNote?: string) => void;
  onReviewGuardInsurance?: (
    guardId: string,
    status: 'verified' | 'rejected',
    rejectionReason?: string
  ) => void | Promise<void>;
  onUpdateGuardIdImages?: (
    guardId: string,
    payload: import('../profile/GuardIdentityVerificationPanel').GuardIdentityVerificationPayload
  ) => Promise<import('../profile/GuardIdentityVerificationPanel').IdentityVerificationSubmitResult>;
  onAddCertification?: (guardId: string, cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onDeleteCertification?: (guardId: string, certId: string) => Promise<CertImageMutationResult>;
  onAttachCertificationImage?: (guardId: string, certId: string, imageUrl: string) => Promise<CertImageMutationResult>;
  onUpdateCertification?: (
    guardId: string,
    certId: string,
    payload: CertUpdatePayload
  ) => Promise<CertUpdateResult>;
  onViewGuard?: (guardId: string) => void;
  canApproveGuardAccounts?: boolean;
  canVerifyGuardCredentials?: boolean;
  canManageGuardAccounts?: boolean;
  canManageClientAccounts?: boolean;
  canReviewJobRequests?: boolean;
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
    description: '',
    icon: <Briefcase className="w-4 h-4" />,
  },
  'schedule-changes': {
    title: 'Schedule changes',
    description: '',
    icon: <Briefcase className="w-4 h-4" />,
  },
  applications: {
    title: 'Guard applications',
    description: '',
    icon: <UserCheck className="w-4 h-4" />,
  },
  credentials: {
    title: 'Guard credentials',
    description: '',
    icon: <ClipboardCheck className="w-4 h-4" />,
  },
  accounts: {
    title: 'Profile approval',
    description: '',
    icon: <Shield className="w-4 h-4" />,
  },
};

function ApprovalListRow({
  title,
  subtitle,
  meta,
  onViewDetails,
}: {
  title: React.ReactNode;
  subtitle?: string;
  meta?: React.ReactNode;
  onViewDetails: () => void;
}) {
  return (
    <div className="app-item-card flex-col !items-stretch gap-2.5 !cursor-default">
      <div className="min-w-0 text-left w-full">
        {typeof title === 'string' ? (
          <p className="font-semibold text-sm truncate">{title}</p>
        ) : (
          title
        )}
        {subtitle && <p className="text-xs text-brand-text-muted mt-0.5 truncate">{subtitle}</p>}
        {meta && <div className="mt-1.5">{meta}</div>}
      </div>
      <button type="button" onClick={onViewDetails} className="app-button-outline app-btn-sm gap-1.5 w-fit">
        <Eye className="w-3.5 h-3.5" />
        View details
      </button>
    </div>
  );
}

function ApprovalDetailScreen({
  title,
  backLabel,
  onBack,
  children,
}: {
  title: string;
  backLabel: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="-mx-4 sm:-mx-5 app-full-page-detail animate-fade-in">
      <AppSubScreenHeader title={title} onBack={onBack} backLabel={backLabel} />
      <div className="px-4 sm:px-5 pb-8 space-y-4">{children}</div>
    </div>
  );
}

function ApprovalQueueHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="mb-4">
      <AppSubScreenHeader title={title} onBack={onBack} backLabel="Approvals" />
    </div>
  );
}

export function StaffApprovals({
  requests,
  guards,
  clients = [],
  onApproveRequest,
  onDenyRequest,
  onApproveScheduleChange,
  onRejectScheduleChange,
  onApproveScheduleChangeBilling,
  onApproveCert,
  onRejectCert,
  onApproveGuardApplication,
  onDenyGuardApplication,
  onApproveClient,
  onApproveGuardAccount,
  onActivateGuardAccount,
  onApproveIdentityVerification,
  onRejectIdentityVerification,
  onRequestIdentityResubmit,
  onRequestCertImageResubmit,
  onReviewGuardInsurance,
  onUpdateGuardIdImages,
  onAddCertification,
  onDeleteCertification,
  onAttachCertificationImage,
  onUpdateCertification,
  onViewGuard,
  canApproveGuardAccounts = false,
  canVerifyGuardCredentials = false,
  canManageGuardAccounts = false,
  canManageClientAccounts = false,
  canReviewJobRequests = false,
  canEditJobListing = false,
  onEditJobListing,
  staffRole,
  initialQueue = null,
  onQueueChange,
}: StaffApprovalsProps) {
  const pendingJobs = getPendingJobApprovals(requests);
  const pendingScheduleChanges = getPendingScheduleChangeApprovals(requests);
  const pendingCerts = getPendingCertifications(guards);
  const pendingGuardAccounts = getPendingGuardAccountReviews(guards);
  const approvedGuardsAwaitingActivation = getApprovedGuardsAwaitingActivation(guards);
  const pendingClientAccounts = getPendingClientAccounts(clients);
  const jobsWithApplications = getOpenJobsWithApplications(requests);

  const [activeQueue, setActiveQueue] = useState<ApprovalQueueId | null>(initialQueue);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [viewCert, setViewCert] = useState<{ guard: SecurityGuard; cert: Certification } | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  const renderGuardAccountCertActions = (guard: SecurityGuard, cert: Certification) =>
    canVerifyGuardCredentials && cert.status === 'pending' ? (
      <div className="flex flex-col items-end gap-1.5">
        <div className="app-action-row--equal justify-end">
          {cert.imageUrl && onRequestCertImageResubmit && (
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  const note = await promptStaffResubmitNote(`${cert.name} photo`);
                  if (note === null) return;
                  onRequestCertImageResubmit(guard.id, cert.id, note);
                })();
              }}
              className="app-button-outline app-btn-sm gap-1"
            >
              Request clearer photo
            </button>
          )}
          <button
            type="button"
            onClick={() => onRejectCert(guard.id, cert.id)}
            className="app-button-outline app-btn-sm text-red-400 border-red-500/40 gap-1"
          >
            <X className="w-3 h-3" /> Reject
          </button>
          <button
            type="button"
            disabled={!staffCanVerifyCertification(cert)}
            title={staffVerifyCertificationBlocker(cert) ?? 'Verify credential'}
            onClick={() => {
              void (async () => {
                try {
                  await onApproveCert(guard.id, cert.id);
                } catch (err) {
                  showAppToast(err instanceof Error ? err.message : 'Could not verify credential.', { tone: 'error' });
                }
              })();
            }}
            className="app-button-primary app-btn-sm gap-1 disabled:opacity-50"
          >
            <Check className="w-3 h-3" /> Verify
          </button>
        </div>
        {staffVerifyCertificationBlocker(cert) && (
          <p className="text-xs text-amber-500 text-right max-w-xs leading-relaxed">
            {staffVerifyCertificationBlocker(cert)}
          </p>
        )}
      </div>
    ) : null;

  useEffect(() => {
    setActiveQueue(initialQueue);
    setActiveItemId(null);
  }, [initialQueue]);

  useEffect(() => {
    if (!activeItemId || !activeQueue) return;
    const stillExists =
      (activeQueue === 'job-offers' && pendingJobs.some((r) => r.id === activeItemId)) ||
      (activeQueue === 'schedule-changes' && pendingScheduleChanges.some((r) => r.id === activeItemId)) ||
      (activeQueue === 'applications' && jobsWithApplications.some((r) => r.id === activeItemId)) ||
      (activeQueue === 'credentials' && pendingCerts.some(({ cert }) => cert.id === activeItemId)) ||
      (activeQueue === 'accounts' &&
        (pendingGuardAccounts.some((g) => g.id === activeItemId) ||
          approvedGuardsAwaitingActivation.some((g) => g.id === activeItemId) ||
          pendingClientAccounts.some((c) => c.id === activeItemId)));
    if (!stillExists) setActiveItemId(null);
  }, [
    activeItemId,
    activeQueue,
    pendingJobs,
    pendingScheduleChanges,
    jobsWithApplications,
    pendingCerts,
    pendingGuardAccounts,
    approvedGuardsAwaitingActivation,
    pendingClientAccounts,
  ]);

  const selectQueue = (queue: ApprovalQueueId | null) => {
    setActiveQueue(queue);
    setActiveItemId(null);
    setEditingJobId(null);
    onQueueChange?.(queue);
  };

  const queueCounts = useMemo(
    () => ({
      'job-offers': pendingJobs.length,
      'schedule-changes': pendingScheduleChanges.length,
      applications: jobsWithApplications.length,
      credentials: pendingCerts.length,
      accounts:
        pendingGuardAccounts.length +
        approvedGuardsAwaitingActivation.length +
        pendingClientAccounts.length,
    }),
    [
      pendingJobs.length,
      pendingScheduleChanges.length,
      jobsWithApplications.length,
      pendingCerts.length,
      pendingGuardAccounts.length,
      approvedGuardsAwaitingActivation.length,
      pendingClientAccounts.length,
    ]
  );

  const availableQueues = (Object.keys(QUEUE_META) as ApprovalQueueId[]).filter((id) => {
    if (queueCounts[id] === 0) return false;
    if (id === 'credentials') return canVerifyGuardCredentials;
    if (id === 'job-offers' || id === 'schedule-changes' || id === 'applications') {
      return canReviewJobRequests;
    }
    if (id === 'accounts') return canApproveGuardAccounts || canManageClientAccounts;
    return false;
  });

  const queueEmpty = availableQueues.length === 0;

  const renderHub = () => (
    <div className="space-y-4">
      {queueEmpty ? (
        <AppEmptyState
          dashed
          icon={<ClipboardCheck className="w-5 h-5" />}
          title="All clear"
        >
          Nothing is waiting for approval right now.
        </AppEmptyState>
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

    return (
      <div className="staff-detail-pane space-y-3">
        <>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-brand-primary shrink-0" />
                <p className="font-semibold text-sm">{req.title}</p>
                <WfBadge tone="warning">Pending approval</WfBadge>
                <WfBadge tone="default">{jobPostingTypeLabel(req.requestType)}</WfBadge>
                {isJobLocationCoordsMissing(req) && <NoMapCoordsBadge />}
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
            <div className="app-action-row--equal pt-2 border-t border-brand-border">
              {showEdit && (
                <button
                  type="button"
                  onClick={() => setEditingJobId(req.id)}
                  className="app-button-outline app-btn-sm"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit job listing
                </button>
              )}
              <button
                type="button"
                onClick={() => onDenyRequest(req.id)}
                className="app-button-outline app-btn-sm text-red-400 border-red-500/40"
              >
                <X className="w-3.5 h-3.5" /> Decline
              </button>
            </div>
            <div className="pt-2">
              <SlideToConfirm
                label="Slide to approve job"
                confirmedLabel="Approved"
                tone="success"
                onConfirm={() => onApproveRequest(req.id)}
              />
            </div>
        </>
      </div>
    );
  };

  const renderScheduleChangeDetail = (req: SecurityRequest) => {
    const currentRange = formatShiftRange(req.startDate, req.endDate);
    const requestedRange =
      req.pendingStartDate && req.pendingEndDate
        ? formatShiftRange(req.pendingStartDate, req.pendingEndDate)
        : '—';
    const isBilling = req.scheduleChangeStatus === 'pending_staff_billing';

    return (
      <div className="staff-detail-pane space-y-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-brand-primary shrink-0" />
            <p className="font-semibold text-sm">{req.title}</p>
            <WfBadge tone="warning">{isBilling ? 'Confirm billing' : 'Schedule change'}</WfBadge>
            {req.scheduleChangeRequestedBy === 'staff' && (
              <WfBadge tone="default">Staff proposed</WfBadge>
            )}
          </div>
          <p className="text-sm text-brand-text-muted">{req.clientName}</p>
          <p className="text-xs text-brand-text-muted mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            {req.location}
          </p>
          <p className="text-xs text-brand-text-muted mt-2">
            Current: {currentRange}
            {req.durationHours > 0 ? ` · ${formatDuration(req.durationHours)}` : ''}
          </p>
          <p className="text-xs text-brand-primary mt-1 font-medium">
            {isBilling ? 'Approved times' : 'Requested'}: {requestedRange}
            {req.pendingDurationHours != null ? ` · ${formatDuration(req.pendingDurationHours)}` : ''}
          </p>
          {(req.scheduleChangeExtraAmount ?? 0) > 0 && (
            <p className="text-xs text-amber-300 mt-1">
              Additional billing: ${(req.scheduleChangeExtraAmount ?? 0).toFixed(2)}
            </p>
          )}
        </div>
        <JobBillingSummaryFromRequest req={req} variant="staff" />
        <div className="app-action-row--equal pt-2 border-t border-brand-border">
          {!isBilling && (
            <button
              type="button"
              onClick={() => onRejectScheduleChange?.(req.id)}
              className="app-button-outline app-btn-sm text-red-400 border-red-500/40"
            >
              <X className="w-3.5 h-3.5" /> Decline
            </button>
          )}
        </div>
        <div className="pt-2">
          <SlideToConfirm
            label={isBilling ? 'Slide to confirm billing & publish' : 'Slide to approve new times'}
            confirmedLabel={isBilling ? 'Confirmed' : 'Approved'}
            tone="success"
            onConfirm={() =>
              isBilling ? onApproveScheduleChangeBilling?.(req.id) : onApproveScheduleChange?.(req.id)
            }
          />
        </div>
      </div>
    );
  };

  const editingJob =
    editingJobId != null ? pendingJobs.find((r) => r.id === editingJobId) ?? null : null;

  const renderQueueList = () => {
    if (!activeQueue) return null;
    const meta = QUEUE_META[activeQueue];

    if (activeQueue === 'job-offers') {
      if (activeItemId) {
        const req = pendingJobs.find((r) => r.id === activeItemId);
        if (!req) return null;
        return (
          <ApprovalDetailScreen
            title={req.title}
            backLabel={meta.title}
            onBack={() => setActiveItemId(null)}
          >
            {renderJobOfferDetail(req)}
          </ApprovalDetailScreen>
        );
      }
      return (
        <>
          <ApprovalQueueHeader title={meta.title} onBack={() => selectQueue(null)} />
          <AppItemCardStack>
            {pendingJobs.map((req) => (
              <ApprovalListRow
                key={req.id}
                title={req.title}
                subtitle={`${req.clientName} · ${req.location}`}
                meta={<WfBadge tone="warning">Review & approve</WfBadge>}
                onViewDetails={() => setActiveItemId(req.id)}
              />
            ))}
          </AppItemCardStack>
        </>
      );
    }

    if (activeQueue === 'schedule-changes') {
      if (activeItemId) {
        const req = pendingScheduleChanges.find((r) => r.id === activeItemId);
        if (!req) return null;
        return (
          <ApprovalDetailScreen
            title={req.title}
            backLabel={meta.title}
            onBack={() => setActiveItemId(null)}
          >
            {renderScheduleChangeDetail(req)}
          </ApprovalDetailScreen>
        );
      }
      return (
        <>
          <ApprovalQueueHeader title={meta.title} onBack={() => selectQueue(null)} />
          <AppItemCardStack>
            {pendingScheduleChanges.map((req) => (
              <ApprovalListRow
                key={req.id}
                title={req.title}
                subtitle={`${req.clientName} · ${req.location}`}
                meta={
                  <WfBadge tone="warning" className="w-fit">
                    {req.scheduleChangeStatus === 'pending_staff_billing' ? 'Confirm billing' : 'Schedule change'}
                  </WfBadge>
                }
                onViewDetails={() => setActiveItemId(req.id)}
              />
            ))}
          </AppItemCardStack>
        </>
      );
    }

    if (activeQueue === 'applications') {
      if (activeItemId) {
        const req = jobsWithApplications.find((r) => r.id === activeItemId);
        if (!req) return null;
        const ranked = rankApplicantGuards(req, guards);
        const pendingGuard = req.pendingGuardId ? guards.find((g) => g.id === req.pendingGuardId) : undefined;
        const awaitingClientGuard = isAwaitingClientGuardApproval(req);
        return (
          <ApprovalDetailScreen
            title={req.title}
            backLabel={meta.title}
            onBack={() => setActiveItemId(null)}
          >
            <div className="staff-detail-pane space-y-3">
              <p className="text-sm text-brand-text-muted">{req.clientName} · {req.location}</p>
              {awaitingClientGuard && pendingGuard && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                  <p className="text-sm font-medium text-amber-300">Awaiting client approval</p>
                  <p className="text-xs text-brand-text-muted mt-1">
                    {pendingGuard.name} was sent to {req.clientName} for confirmation.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                {ranked.map((guard, index) => {
                  const meets = guardMeetsJobRequirements(guard, req);
                  const isPending = req.pendingGuardId === guard.id;
                  const anotherPending = !!req.pendingGuardId && !isPending;
                  return (
                    <WfListCard
                      key={guard.id}
                      avatar={<ProfileAvatar src={guard.avatar} name={guard.name} size="xs" />}
                      title={`${index === 0 ? '★ ' : ''}${guard.name}`}
                      subtitle={`★ ${guard.rating.toFixed(1)} · ${guard.jobsCompleted} jobs`}
                      meta={
                        <span className={isPending ? 'text-amber-400' : meets ? 'text-emerald-400' : 'text-amber-400'}>
                          {isPending
                            ? 'Awaiting client approval'
                            : meets
                              ? 'Meets job requirements'
                              : 'Missing required credentials'}
                        </span>
                      }
                      action={
                        <div className="flex flex-col gap-1.5 shrink-0">
                          {isPending ? (
                            onDenyGuardApplication && (
                              <button
                                type="button"
                                onClick={() => onDenyGuardApplication(req.id, guard.id)}
                                className="app-button-outline app-btn-sm text-red-400 border-red-500/40"
                              >
                                Withdraw
                              </button>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={() => onApproveGuardApplication(req.id, guard.id)}
                              disabled={!meets || anotherPending}
                              className="app-button-primary app-btn-sm disabled:opacity-40"
                            >
                              Send to client
                            </button>
                          )}
                          {!isPending && onDenyGuardApplication && (
                            <button
                              type="button"
                              onClick={() => onDenyGuardApplication(req.id, guard.id)}
                              className="app-button-outline app-btn-sm text-red-400 border-red-500/40"
                            >
                              Decline
                            </button>
                          )}
                        </div>
                      }
                    />
                  );
                })}
              </div>
            </div>
          </ApprovalDetailScreen>
        );
      }
      return (
        <>
          <ApprovalQueueHeader title={meta.title} onBack={() => selectQueue(null)} />
          <AppItemCardStack>
            {jobsWithApplications.map((req) => (
              <ApprovalListRow
                key={req.id}
                title={req.title}
                subtitle={`${req.applicants.length} applicant${req.applicants.length === 1 ? '' : 's'} · ${req.location}${
                  isAwaitingClientGuardApproval(req) ? ' · Awaiting client' : ''
                }`}
                onViewDetails={() => setActiveItemId(req.id)}
              />
            ))}
          </AppItemCardStack>
        </>
      );
    }

    if (activeQueue === 'credentials') {
      if (activeItemId) {
        const entry = pendingCerts.find(({ cert }) => cert.id === activeItemId);
        if (!entry) return null;
        const { guard, cert } = entry;
        return (
          <ApprovalDetailScreen
            title={`${guard.name} — ${certDisplayName(cert)}`}
            backLabel={meta.title}
            onBack={() => setActiveItemId(null)}
          >
            <div className="staff-detail-pane space-y-4">
              <CredentialCategoryBadge cert={cert} />
              <p className="text-sm text-brand-text-muted">
                {certViewSectionLabel(cert)} · {cert.issuer} · #{cert.number}
                {cert.state ? ` · ${cert.state}` : ''}
              </p>
              <div className="app-action-row--equal">
                <button
                  type="button"
                  onClick={() => setViewCert({ guard, cert })}
                  className="app-button-outline app-btn-sm gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View document
                </button>
                {onViewGuard && (
                  <button
                    type="button"
                    onClick={() => onViewGuard(guard.id)}
                    className="app-button-outline app-btn-sm"
                  >
                    Full profile
                  </button>
                )}
                {canVerifyGuardCredentials && cert.imageUrl && onRequestCertImageResubmit && (
                  <button
                    type="button"
                    onClick={() => {
                      void (async () => {
                        const note = await promptStaffResubmitNote(`${cert.name} photo`);
                        if (note === null) return;
                        onRequestCertImageResubmit(guard.id, cert.id, note);
                        setActiveItemId(null);
                      })();
                    }}
                    className="app-button-outline app-btn-sm"
                  >
                    Request clearer photo
                  </button>
                )}
                {canVerifyGuardCredentials && (
                  <>
                <button
                  type="button"
                  onClick={() => onRejectCert(guard.id, cert.id)}
                  className="app-button-outline app-btn-sm text-red-400 border-red-500/40"
                >
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
                <button
                  type="button"
                  disabled={!staffCanVerifyCertification(cert)}
                  title={staffVerifyCertificationBlocker(cert) ?? 'Verify credential'}
                  onClick={() => {
                    void (async () => {
                      try {
                        await onApproveCert(guard.id, cert.id);
                        setActiveItemId(null);
                      } catch (err) {
                        showAppToast(err instanceof Error ? err.message : 'Could not verify credential.', { tone: 'error' });
                      }
                    })();
                  }}
                  className="app-button-primary app-btn-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" /> Verify
                </button>
                  </>
                )}
              </div>
              {staffVerifyCertificationBlocker(cert) && (
                <p className="text-xs text-amber-500 leading-relaxed">
                  {staffVerifyCertificationBlocker(cert)}
                </p>
              )}
            </div>
          </ApprovalDetailScreen>
        );
      }
      const pendingSections = groupPendingCertsByViewSection(pendingCerts, { hideEmpty: true });
      return (
        <>
          <ApprovalQueueHeader title={meta.title} onBack={() => selectQueue(null)} />
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
                    <ApprovalListRow
                      key={cert.id}
                      title={
                        <div className="flex items-start justify-between gap-2 w-full">
                          <p className="font-semibold text-sm truncate">{guard.name}</p>
                          <CredentialCategoryBadge cert={cert} variant="category" className="shrink-0" />
                        </div>
                      }
                      subtitle={`${certDisplayName(cert)} · ${cert.issuer} · #${cert.number}`}
                      onViewDetails={() => setActiveItemId(cert.id)}
                    />
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
        const guard =
          pendingGuardAccounts.find((g) => g.id === activeItemId) ??
          approvedGuardsAwaitingActivation.find((g) => g.id === activeItemId) ??
          null;
        const client = pendingClientAccounts.find((c) => c.id === activeItemId) ?? null;

        if (guard) {
          const checklist = getGuardActivationChecklist(guard);
          const isApprovedGuard = isGuardAccountApproved(guard);
          const approvalBlockers = isApprovedGuard ? checklist.staffActivationBlockers : checklist.staffApprovalBlockers;
          const canTakeAction = isApprovedGuard
            ? guardCanStaffActivateAccount(guard)
            : guardCanStaffApproveProfile(guard);

          return (
            <ApprovalDetailScreen
              title={guard.name}
              backLabel={meta.title}
              onBack={() => setActiveItemId(null)}
            >
              <div className="staff-detail-pane space-y-4">
                <p className="text-sm text-brand-text-muted">{guard.email}</p>
                <p className="text-xs text-brand-text-muted">
                  {isApprovedGuard ? 'Guard account activation' : 'Guard profile approval'}
                </p>
                <StaffGuardActivationChecklistView guard={guard} />
                {approvalBlockers.length > 0 && (
                  <div className="text-sm text-amber-400 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2 leading-relaxed space-y-1">
                    <p className="font-semibold">Before you can {isApprovedGuard ? 'activate' : 'approve'}:</p>
                    <ul className="list-disc list-inside text-xs space-y-0.5">
                      {approvalBlockers.map((blocker) => (
                        <li key={blocker}>{blocker}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <GuardCredentialsPanel
                  guard={guard}
                  editing={false}
                  staffMode={canManageGuardAccounts}
                  onSubmitIdentityVerification={
                    canManageGuardAccounts && onUpdateGuardIdImages
                      ? (payload) => onUpdateGuardIdImages(guard.id, payload)
                      : undefined
                  }
                  onAddCertification={
                    canManageGuardAccounts && onAddCertification
                      ? (cert) => onAddCertification(guard.id, cert)
                      : undefined
                  }
                  onDeleteCertification={
                    canManageGuardAccounts && onDeleteCertification
                      ? (certId) => onDeleteCertification(guard.id, certId)
                      : undefined
                  }
                  onAttachCertificationImage={
                    canManageGuardAccounts && onAttachCertificationImage
                      ? (certId, imageUrl) => onAttachCertificationImage(guard.id, certId, imageUrl)
                      : undefined
                  }
                  onUpdateCertification={
                    onUpdateCertification
                      ? (certId, payload) => onUpdateCertification(guard.id, certId, payload)
                      : undefined
                  }
                  onReviewInsurance={
                    canVerifyGuardCredentials && onReviewGuardInsurance
                      ? (status, rejectionReason) => onReviewGuardInsurance(guard.id, status, rejectionReason)
                      : undefined
                  }
                  staffIdReview={
                    canVerifyGuardCredentials ? (
                      <StaffIdReviewSection
                        guard={guard}
                        canManage={canVerifyGuardCredentials}
                        onApprove={onApproveIdentityVerification}
                        onReject={
                          onRejectIdentityVerification
                            ? (guardId, reason) => onRejectIdentityVerification(guardId, reason)
                            : undefined
                        }
                        onRequestResubmit={
                          onRequestIdentityResubmit
                            ? (guardId, slots, staffNote) => onRequestIdentityResubmit(guardId, slots, staffNote)
                            : undefined
                        }
                      />
                    ) : undefined
                  }
                  renderCertActions={(cert) => renderGuardAccountCertActions(guard, cert)}
                />
                <div className="app-action-row--equal pt-2 border-t border-brand-border">
                  {onViewGuard && (
                    <button type="button" onClick={() => onViewGuard(guard.id)} className="app-button-outline app-btn-sm">
                      Full profile
                    </button>
                  )}
                  {isApprovedGuard && canApproveGuardAccounts && onActivateGuardAccount && (
                    <button
                      type="button"
                      disabled={!canTakeAction}
                      title={
                        canTakeAction
                          ? 'Grant marketplace eligibility'
                          : approvalBlockers.join(' · ') || 'All credentials must be verified before activation'
                      }
                      onClick={() => {
                        void (async () => {
                          if (!canTakeAction) return;
                          try {
                            await onActivateGuardAccount(guard.id);
                            setActiveItemId(null);
                          } catch (err) {
                            showAppToast(err instanceof Error ? err.message : 'Could not grant marketplace eligibility.', { tone: 'error' });
                          }
                        })();
                      }}
                      className="app-button-primary app-btn-sm gap-1 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Grant eligibility
                    </button>
                  )}
                </div>
                {!isApprovedGuard && canApproveGuardAccounts && onApproveGuardAccount && (
                  <div className="pt-2">
                    <SlideToConfirm
                      label="Slide to approve application"
                      confirmedLabel="Approved"
                      tone="success"
                      disabled={!canTakeAction}
                      disabledHint={approvalBlockers.join(' · ') || 'Application must be pending and not blocked'}
                      onConfirm={() => {
                        void (async () => {
                          if (!canTakeAction) return;
                          try {
                            await onApproveGuardAccount(guard.id);
                            setActiveItemId(null);
                          } catch (err) {
                            showAppToast(err instanceof Error ? err.message : 'Could not approve profile.', { tone: 'error' });
                          }
                        })();
                      }}
                    />
                  </div>
                )}
              </div>
            </ApprovalDetailScreen>
          );
        }

        if (client) {
          const budgetLabel: Record<string, string> = {
            'under-500': 'Under $500',
            '500-2000': '$500 – $2,000',
            '2000-5000': '$2,000 – $5,000',
            '5000-15000': '$5,000 – $15,000',
            '15000+': '$15,000+',
            'ongoing': 'Ongoing / monthly contract',
          };
          const frequencyLabel: Record<string, string> = {
            'one-time': 'One-time event',
            'recurring': 'Ongoing / recurring',
            'temporary': 'Temporary / short-term',
          };
          const armedLabel: Record<string, string> = {
            armed: 'Armed',
            unarmed: 'Unarmed',
            'no-preference': 'No preference',
          };

          return (
            <ApprovalDetailScreen
              title={client.companyName || client.name}
              backLabel={meta.title}
              onBack={() => setActiveItemId(null)}
            >
              <div className="staff-detail-pane space-y-5">
                <WfBadge tone="warning">Pending approval</WfBadge>

                {/* ── Identity ── */}
                <section className="space-y-2">
                  <p className="uber-label text-xs">Contact</p>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold">{client.name}</p>
                    <p className="text-brand-text-muted flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 shrink-0 inline-block">@</span>
                      {client.email}
                    </p>
                    {client.phone && (
                      <p className="text-brand-text-muted flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        {client.phone}
                      </p>
                    )}
                    {client.website && (
                      <p className="text-brand-text-muted flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline truncate">{client.website}</a>
                      </p>
                    )}
                  </div>
                </section>

                {/* ── Business info ── */}
                {(client.businessType || (client.industries && client.industries.length > 0) || client.businessLicense) && (
                  <section className="space-y-2 pt-3 border-t border-brand-border">
                    <p className="uber-label text-xs">Business</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      {client.businessType && (
                        <>
                          <span className="text-brand-text-muted">Type</span>
                          <span>{client.businessType}</span>
                        </>
                      )}
                      {client.businessLicense && (
                        <>
                          <span className="text-brand-text-muted">License / EIN</span>
                          <span className="font-mono text-xs">{client.businessLicense}</span>
                        </>
                      )}
                    </div>
                    {client.industries && client.industries.length > 0 && (
                      <div>
                        <p className="text-xs text-brand-text-muted mb-1.5">Industry</p>
                        <div className="flex flex-wrap gap-1.5">
                          {client.industries.map((ind) => (
                            <span key={ind} className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-primary/15 text-brand-primary border border-brand-primary/30">
                              {ind}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* ── Security needs ── */}
                <section className="space-y-2 pt-3 border-t border-brand-border">
                  <p className="uber-label text-xs">Security needs</p>
                  {client.serviceDescription && (
                    <p className="text-sm text-brand-text border-l-2 border-brand-primary pl-3 leading-relaxed">
                      {client.serviceDescription}
                    </p>
                  )}
                  {client.serviceTypes && client.serviceTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {client.serviceTypes.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-primary/15 text-brand-primary border border-brand-primary/30">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    {client.estimatedGuardsNeeded != null && (
                      <>
                        <span className="text-brand-text-muted">Guards needed</span>
                        <span>{client.estimatedGuardsNeeded}</span>
                      </>
                    )}
                    {client.armedPreference && (
                      <>
                        <span className="text-brand-text-muted">Armed preference</span>
                        <span>{armedLabel[client.armedPreference] ?? client.armedPreference}</span>
                      </>
                    )}
                    {client.serviceFrequencies && client.serviceFrequencies.length > 0 && (
                        <>
                          <span className="text-brand-text-muted">Engagement type</span>
                          <span>{client.serviceFrequencies.map((f) => frequencyLabel[f] ?? f).join(', ')}</span>
                        </>
                      )}
                    {client.estimatedStartDate && (
                      <>
                        <span className="text-brand-text-muted">Est. start</span>
                        <span>{client.estimatedStartDate}</span>
                      </>
                    )}
                    {client.budgetRange && (
                      <>
                        <span className="text-brand-text-muted">Budget range</span>
                        <span>{budgetLabel[client.budgetRange] ?? client.budgetRange}</span>
                      </>
                    )}
                  </div>
                </section>

                {/* ── Location ── */}
                {(client.serviceCity || client.serviceState || (client.propertyTypes && client.propertyTypes.length > 0)) && (
                  <section className="space-y-2 pt-3 border-t border-brand-border">
                    <p className="uber-label text-xs">Location</p>
                    {(client.serviceCity || client.serviceState) && (
                      <p className="text-sm flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-text-muted shrink-0" />
                        {[client.serviceCity, client.serviceState].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {client.propertyTypes && client.propertyTypes.length > 0 && (
                      <div>
                        <p className="text-xs text-brand-text-muted mb-1.5">Property type</p>
                        <div className="flex flex-wrap gap-1.5">
                          {client.propertyTypes.map((pt) => (
                            <span key={pt} className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-primary/15 text-brand-primary border border-brand-primary/30">
                              {pt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* ── Prior experience ── */}
                {(client.hasPriorSecurityService != null || client.specialRequirements) && (
                  <section className="space-y-2 pt-3 border-t border-brand-border">
                    <p className="uber-label text-xs">Background</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      {client.hasPriorSecurityService != null && (
                        <>
                          <span className="text-brand-text-muted">Prior security</span>
                          <span>
                            {client.hasPriorSecurityService ? 'Yes' : 'No'}
                            {client.priorSecurityProvider ? ` — ${client.priorSecurityProvider}` : ''}
                          </span>
                        </>
                      )}
                    </div>
                    {client.specialRequirements && (
                      <p className="text-sm text-brand-text-muted leading-relaxed border-l-2 border-brand-border pl-3">
                        {client.specialRequirements}
                      </p>
                    )}
                  </section>
                )}

                {/* ── Referral / Discovery ── */}
                {(client.referredBy || client.howHeardAboutUs) && (
                  <section className="space-y-2 pt-3 border-t border-brand-border">
                    <p className="uber-label text-xs">How they found us</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      {client.referredBy && (
                        <>
                          <span className="text-brand-text-muted">Referred by</span>
                          <span>
                            {client.referredBy}
                            {client.referredById && (
                              <span className="text-xs text-brand-text-muted ml-1">(on platform)</span>
                            )}
                          </span>
                        </>
                      )}
                      {client.howHeardAboutUs && (
                        <>
                          <span className="text-brand-text-muted">Source</span>
                          <span>{client.howHeardAboutUs}</span>
                        </>
                      )}
                    </div>
                  </section>
                )}

                {/* ── Approve action ── */}
                {onApproveClient && (
                  <div className="pt-3 border-t border-brand-border">
                    <button
                      type="button"
                      onClick={() => {
                        onApproveClient(client.id);
                        setActiveItemId(null);
                      }}
                      className="app-button-primary app-btn-sm gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve client
                    </button>
                  </div>
                )}
              </div>
            </ApprovalDetailScreen>
          );
        }

        return null;
      }

      return (
        <>
          <ApprovalQueueHeader title={meta.title} onBack={() => selectQueue(null)} />
          <AppItemCardStack>
            {pendingGuardAccounts.map((guard) => (
              <div key={guard.id} className="app-item-card flex-col !items-stretch gap-2.5 !cursor-default">
                <WfListCard
                  avatar={<ProfileAvatar src={guard.avatar} name={guard.name} size="sm" rounded="lg" />}
                  title={guard.name}
                  subtitle={`Profile approval · ${guardActivationSummaryLabel(guard)}`}
                  meta={
                    <div className="flex items-center justify-between gap-2 w-full min-w-0">
                      <GuardRosterStatusBadges guard={guard} />
                      <GuardMissingCredentialsBadge guard={guard} className="shrink-0" />
                    </div>
                  }
                />
                <button
                  type="button"
                  onClick={() => setActiveItemId(guard.id)}
                  className="app-button-outline app-btn-sm gap-1.5 w-fit"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View details
                </button>
              </div>
            ))}
            {approvedGuardsAwaitingActivation.map((guard) => (
              <div key={guard.id} className="app-item-card flex-col !items-stretch gap-2.5 !cursor-default">
                <WfListCard
                  avatar={<ProfileAvatar src={guard.avatar} name={guard.name} size="sm" rounded="lg" />}
                  title={guard.name}
                  subtitle={`Account activation · ${guardActivationSummaryLabel(guard)}`}
                  meta={
                    <div className="flex items-center justify-between gap-2 w-full min-w-0">
                      <GuardRosterStatusBadges guard={guard} />
                      <GuardMissingCredentialsBadge guard={guard} className="shrink-0" />
                    </div>
                  }
                />
                <button
                  type="button"
                  onClick={() => setActiveItemId(guard.id)}
                  className="app-button-outline app-btn-sm gap-1.5 w-fit"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View details
                </button>
              </div>
            ))}
            {pendingClientAccounts.map((client) => (
              <ApprovalListRow
                key={client.id}
                title={client.companyName || client.name}
                subtitle="Client sign-up"
                onViewDetails={() => setActiveItemId(client.id)}
              />
            ))}
          </AppItemCardStack>
        </>
      );
    }

    return null;
  };

  return (
    <div className="animate-fade-in space-y-4">
      {!activeQueue ? renderHub() : renderQueueList()}

      {viewCert && (
        <CertDetailModal
          cert={viewCert.cert}
          guardName={viewCert.guard.name}
          onClose={() => setViewCert(null)}
        />
      )}

      {editingJob && onEditJobListing && (
        <EditRequestSheet
          open={editingJobId !== null}
          request={editingJob}
          scheduleLocked={isJobScheduleLocked(editingJob)}
          paidReschedule={canStaffReschedulePaidSchedule(editingJob)}
          onSave={async (requestId, updates) => {
            await onEditJobListing(requestId, updates);
            setEditingJobId(null);
          }}
          onClose={() => setEditingJobId(null)}
        />
      )}
    </div>
  );
}
