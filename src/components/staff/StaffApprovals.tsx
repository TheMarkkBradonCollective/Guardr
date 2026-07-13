import { showAppToast } from '../ui/AppToast';
import { SlideToConfirm } from '../ui/SlideToConfirm';
import React, { useEffect, useMemo, useState } from 'react';
import { Certification, Client, PlatformRole, SecurityGuard, SecurityRequest } from '../../types';
import type { ApprovalQueueId } from '../../lib/staffOps';
import {
  APPROVAL_QUEUE_TAB_LABELS,
  APPROVAL_QUEUE_TAB_ORDER,
  normalizeApprovalQueueId,
} from '../../lib/staffOps';
import { loadAuditLog, type AuditLogEntry } from '../../lib/auditLog';
import {
  buildStaffApprovalsFeed,
  filterApprovalsFeedByQueue,
  findFeedItem,
  formatApprovalTimestamp,
  type ApprovalFeedItem,
} from '../../lib/staffApprovalsFeed';
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { canStaffEditJobTitleAndLocation, canStaffEditJobMapCoordinates, isJobScheduleLocked, canStaffReschedulePaidSchedule } from '../../lib/jobEditRules';
import { jobPostingTypeLabel } from '../../lib/jobStatus';
import { EditRequestSheet } from '../jobs/EditRequestSheet';
import { guardMeetsJobRequirements, rankApplicantGuards } from '../../lib/jobApplications';
import { isAwaitingClientGuardApproval } from '../../lib/guardAssignment';
import { isJobLocationCoordsMissing } from '../../lib/jobLocation';
import { getPendingJobApprovals } from '../../lib/staffOps';
import {
  getGuardActivationChecklist,
  guardCanStaffActivateAccount,
  guardCanStaffApproveProfile,
} from '../../lib/guardAccountActivation';
import { isGuardAccountApproved, isGuardUserStatusActive } from '../../lib/accountStatus';
import { StaffGuardActivationChecklistView } from './StaffGuardActivationChecklistView';
import { StaffIdReviewSection } from './StaffIdReviewSection';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { GuardCredentialsPanel } from '../profile/GuardCredentialsPanel';
import { GuardCoiDetailModal } from '../profile/GuardCoiDetailModal';
import { CertDetailModal } from '../credentials/CertDetailModal';
import { CoiCredentialBadge } from '../credentials/CoiCredentialBadge';
import { CredentialCategoryBadge } from '../credentials/CredentialCategoryBadge';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import type { CertUpdatePayload, CertUpdateResult } from '../credentials/CertDetailModal';
import { certDisplayName } from '../../lib/certCatalog';
import {
  certViewSectionLabel,
  coiViewSectionLabel,
  guardIdFromCoiApprovalItemId,
  isCoiApprovalItemId,
} from '../../lib/guardCredentialSections';
import { formatCoiSummaryLine, getPendingInsuranceReviews } from '../../lib/guardInsurance';
import { promptStaffResubmitNote } from '../../lib/staffDocumentReview';
import { staffCanVerifyCertification, staffVerifyCertificationBlocker } from '../../lib/certImagePolicy';
import { NoMapCoordsBadge } from '../jobs/NoMapCoordsBadge';
import { JobBillingSummaryFromRequest } from '../jobs/JobBillingSummary';
import { AppEmptyState, AppItemCardStack, AppSegmentedControl, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { WfBadge, WfListCard } from '../ui/wireframe';
import { Briefcase, Check, ClipboardCheck, Eye, Globe, MapPin, Pencil, Phone, Shield, UserCheck, X } from 'lucide-react';

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
  canActivateGuardAccounts?: boolean;
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
  Exclude<ApprovalQueueId, 'accounts'>,
  { title: string; description: string; icon: React.ReactNode }
> = {
  all: {
    title: 'All approvals',
    description: '',
    icon: <ClipboardCheck className="w-4 h-4" />,
  },
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
  'guard-accounts': {
    title: 'Guard profiles',
    description: '',
    icon: <Shield className="w-4 h-4" />,
  },
  'client-accounts': {
    title: 'Client sign-ups',
    description: '',
    icon: <UserCheck className="w-4 h-4" />,
  },
};

function ApprovalReviewMeta({ item }: { item?: ApprovalFeedItem }) {
  if (!item) return null;
  const reviewer = item.reviewedByName || item.reviewedByEmail;
  return (
    <div className="rounded-lg border border-brand-border bg-brand-bg-sec/40 px-3 py-2.5 text-xs space-y-1">
      <p>
        <span className="font-semibold text-brand-text">Status: </span>
        {item.statusLabel}
      </p>
      {item.reviewedAt && (
        <p>
          <span className="font-semibold text-brand-text">Reviewed: </span>
          {formatApprovalTimestamp(item.reviewedAt)}
        </p>
      )}
      {reviewer && (
        <p>
          <span className="font-semibold text-brand-text">By: </span>
          {reviewer}
        </p>
      )}
    </div>
  );
}

function ApprovalFeedRow({
  item,
  onViewDetails,
}: {
  item: ApprovalFeedItem;
  onViewDetails: () => void;
}) {
  const tone =
    item.status === 'pending' || item.status === 'in_review'
      ? 'warning'
      : item.status === 'approved' || item.status === 'active'
        ? 'success'
        : 'danger';

  return (
    <ApprovalListRow
      title={item.title}
      subtitle={item.subtitle}
      meta={
        <div className="space-y-1">
          <WfBadge tone={tone}>{item.statusLabel}</WfBadge>
          {(item.reviewedAt || item.reviewedByName) &&
            item.status !== 'pending' &&
            item.status !== 'in_review' && (
              <p className="text-[11px] text-brand-text-muted">
                {item.reviewedAt ? formatApprovalTimestamp(item.reviewedAt) : ''}
                {item.reviewedByName ? ` · ${item.reviewedByName}` : ''}
              </p>
            )}
        </div>
      }
      onViewDetails={onViewDetails}
    />
  );
}

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
  canActivateGuardAccounts = false,
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
  const pendingInsuranceReviews = getPendingInsuranceReviews(guards);

  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [viewCert, setViewCert] = useState<{ guard: SecurityGuard; cert: Certification } | null>(null);
  const [viewCoi, setViewCoi] = useState<SecurityGuard | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  // Guards approve/reject/verify actions below from double-submission —
  // these are real marketplace writes (credential verification, account
  // approval) and had no in-flight protection, so a fast double-click
  // could fire the same mutation twice.
  const [actionPending, setActionPending] = useState(false);
  const runGuardedAction = async (action: () => Promise<void>, onError?: (message: string) => void) => {
    if (actionPending) return;
    setActionPending(true);
    try {
      await action();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setActionPending(false);
    }
  };

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
            disabled={actionPending}
            onClick={() => void runGuardedAction(async () => onRejectCert(guard.id, cert.id))}
            className="app-button-outline app-btn-sm text-red-400 border-red-500/40 gap-1 disabled:opacity-50"
          >
            <X className="w-3 h-3" /> Reject
          </button>
          <button
            type="button"
            disabled={actionPending || !staffCanVerifyCertification(cert)}
            title={staffVerifyCertificationBlocker(cert) ?? 'Verify credential'}
            onClick={() =>
              void runGuardedAction(
                async () => onApproveCert(guard.id, cert.id),
                (message) => showAppToast(message, { tone: 'error' })
              )
            }
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

  const permittedQueues = useMemo(
    () => {
      const specific = APPROVAL_QUEUE_TAB_ORDER.filter((id) => {
        if (id === 'all') return false;
        if (id === 'credentials') return canVerifyGuardCredentials;
        if (id === 'job-offers' || id === 'schedule-changes' || id === 'applications') {
          return canReviewJobRequests;
        }
        if (id === 'guard-accounts') return canApproveGuardAccounts;
        if (id === 'client-accounts') return canManageClientAccounts;
        return false;
      });
      return specific.length > 0 ? (['all', ...specific] as ApprovalQueueId[]) : [];
    },
    [
      canVerifyGuardCredentials,
      canReviewJobRequests,
      canApproveGuardAccounts,
      canManageClientAccounts,
    ]
  );

  const [activeQueue, setActiveQueue] = useState<ApprovalQueueId | null>(() =>
    normalizeApprovalQueueId(initialQueue, permittedQueues)
  );

  useEffect(() => {
    let cancelled = false;
    void loadAuditLog(400).then((entries) => {
      if (!cancelled) setAuditLog(entries);
    });
    return () => {
      cancelled = true;
    };
  }, [requests, guards, clients]);

  const approvalFeed = useMemo(
    () =>
      buildStaffApprovalsFeed({
        requests,
        guards,
        clients,
        auditLog,
      }),
    [requests, guards, clients, auditLog]
  );

  const queueCounts = useMemo(() => {
    const counts: Partial<Record<ApprovalQueueId, number>> = { all: approvalFeed.length };
    for (const item of approvalFeed) {
      counts[item.queue] = (counts[item.queue] ?? 0) + 1;
    }
    return counts;
  }, [approvalFeed]);

  const activeTabLabel =
    activeQueue && activeQueue !== 'accounts'
      ? APPROVAL_QUEUE_TAB_LABELS[activeQueue]
      : 'Approvals';

  const tabOptions = useMemo(
    () =>
      permittedQueues.map((id) => ({
        id,
        label:
          (queueCounts[id] ?? 0) > 0
            ? `${APPROVAL_QUEUE_TAB_LABELS[id]} (${queueCounts[id]})`
            : APPROVAL_QUEUE_TAB_LABELS[id],
      })),
    [permittedQueues, queueCounts]
  );

  useEffect(() => {
    setActiveQueue((current) => normalizeApprovalQueueId(initialQueue ?? current, permittedQueues));
    setActiveItemId(null);
  }, [initialQueue, permittedQueues]);

  useEffect(() => {
    if (!permittedQueues.length) {
      setActiveQueue(null);
      return;
    }
    setActiveQueue((current) => normalizeApprovalQueueId(current ?? initialQueue, permittedQueues));
  }, [permittedQueues, initialQueue]);

  useEffect(() => {
    if (!activeItemId) return;
    if (!findFeedItem(approvalFeed, activeItemId)) setActiveItemId(null);
  }, [activeItemId, approvalFeed]);

  const selectQueue = (queue: ApprovalQueueId) => {
    const next = normalizeApprovalQueueId(queue, permittedQueues);
    if (!next) return;
    setActiveQueue(next);
    setActiveItemId(null);
    setEditingJobId(null);
    onQueueChange?.(next);
  };

  const renderApprovalsTabs = () => {
    if (!activeQueue || activeQueue === 'accounts' || permittedQueues.length === 0) return null;
    return (
      <div className="staff-approvals-tabs -mx-0 mb-4">
        <AppSegmentedControl
          options={tabOptions}
          value={activeQueue}
          onChange={selectQueue}
        />
      </div>
    );
  };

  const renderTabEmptyState = (queueId: Exclude<ApprovalQueueId, 'accounts'>) => {
    const meta = QUEUE_META[queueId];
    return (
      <AppEmptyState dashed icon={meta.icon} title="No records yet">
        {queueId === 'all'
          ? 'Approval history will appear here as items are submitted and reviewed.'
          : `Nothing in ${meta.title.toLowerCase()} yet.`}
      </AppEmptyState>
    );
  };

  const renderFeedList = () => {
    if (!activeQueue || activeQueue === 'accounts') return null;
    const items = filterApprovalsFeedByQueue(approvalFeed, activeQueue);
    if (items.length === 0) return renderTabEmptyState(activeQueue);
    return (
      <AppItemCardStack>
        {items.map((item) => (
          <ApprovalFeedRow
            key={`${item.queue}-${item.id}`}
            item={item}
            onViewDetails={() => setActiveItemId(item.id)}
          />
        ))}
      </AppItemCardStack>
    );
  };

  const renderJobOfferDetail = (req: SecurityRequest, feedItem?: ApprovalFeedItem) => {
    const isPending = feedItem?.status === 'pending';
    const coordsMissing = isJobLocationCoordsMissing(req);
    const showEditListing =
      canEditJobListing && onEditJobListing && staffRole && canStaffEditJobTitleAndLocation(req, staffRole);
    const showEditCoords =
      onEditJobListing && staffRole && canStaffEditJobMapCoordinates(req, staffRole) && coordsMissing;
    const showEdit = showEditListing || showEditCoords;

    return (
      <div className="staff-detail-pane space-y-3">
        <>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-brand-primary shrink-0" />
                <p className="font-semibold text-sm">{req.title}</p>
                {feedItem ? (
                  <WfBadge
                    tone={
                      feedItem.status === 'pending'
                        ? 'warning'
                        : feedItem.status === 'approved'
                          ? 'success'
                          : 'danger'
                    }
                  >
                    {feedItem.statusLabel}
                  </WfBadge>
                ) : (
                  <WfBadge tone="warning">Pending approval</WfBadge>
                )}
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
            {isPending && (
              <>
                <div className="app-action-row--equal pt-2 border-t border-brand-border">
                  {showEdit && (
                    <button
                      type="button"
                      onClick={() => setEditingJobId(req.id)}
                      className="app-button-outline app-btn-sm"
                    >
                      <Pencil className="w-3.5 h-3.5" /> {showEditCoords && !showEditListing ? 'Add map coordinates' : 'Edit job listing'}
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
                {coordsMissing && (
                  <p className="text-xs text-amber-300/90 leading-relaxed">
                    Map coordinates are required before this job can go live. Moderator or above must add them, then an administrator can approve.
                  </p>
                )}
                <div className="pt-2">
                  <SlideToConfirm
                    label="Slide to approve job"
                    confirmedLabel="Approved"
                    tone="success"
                    disabled={coordsMissing}
                    disabledHint="Add map coordinates before approving"
                    onConfirm={() => onApproveRequest(req.id)}
                  />
                </div>
              </>
            )}
        </>
      </div>
    );
  };

  const renderScheduleChangeDetail = (req: SecurityRequest, feedItem?: ApprovalFeedItem) => {
    const isPending = feedItem?.status === 'pending';
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
        {isPending && (
          <>
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
          </>
        )}
      </div>
    );
  };

  const editingJob =
    editingJobId != null ? pendingJobs.find((r) => r.id === editingJobId) ?? null : null;

  const renderQueueList = () => {
    if (!activeQueue || activeQueue === 'accounts') return null;
    if (!activeItemId) return renderFeedList();

    const feedItem = findFeedItem(approvalFeed, activeItemId);
    const effectiveQueue = feedItem?.queue ?? (activeQueue !== 'all' ? activeQueue : null);
    if (!effectiveQueue) return null;

    if (effectiveQueue === 'job-offers') {
      const req = requests.find((r) => r.id === activeItemId);
      if (!req) return null;
      return (
        <ApprovalDetailScreen
          title={req.title}
          backLabel={activeTabLabel}
          onBack={() => setActiveItemId(null)}
        >
          <ApprovalReviewMeta item={feedItem} />
          {renderJobOfferDetail(req, feedItem)}
        </ApprovalDetailScreen>
      );
    }

    if (effectiveQueue === 'schedule-changes') {
      const req = requests.find((r) => r.id === activeItemId);
      if (!req) return null;
      return (
        <ApprovalDetailScreen
          title={req.title}
          backLabel={activeTabLabel}
          onBack={() => setActiveItemId(null)}
        >
          <ApprovalReviewMeta item={feedItem} />
          {renderScheduleChangeDetail(req, feedItem)}
        </ApprovalDetailScreen>
      );
    }

    if (effectiveQueue === 'applications') {
      const req = requests.find((r) => r.id === activeItemId);
      if (!req) return null;
      const ranked = rankApplicantGuards(req, guards);
      const pendingGuard = req.pendingGuardId ? guards.find((g) => g.id === req.pendingGuardId) : undefined;
      const awaitingClientGuard = isAwaitingClientGuardApproval(req);
      const canActOnApplications = feedItem?.status === 'pending' || feedItem?.status === 'in_review';
      return (
        <ApprovalDetailScreen
          title={req.title}
          backLabel={activeTabLabel}
          onBack={() => setActiveItemId(null)}
        >
          <div className="staff-detail-pane space-y-3">
            <ApprovalReviewMeta item={feedItem} />
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
                      canActOnApplications ? (
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
                      ) : undefined
                    }
                  />
                );
              })}
            </div>
          </div>
        </ApprovalDetailScreen>
      );
    }

    if (effectiveQueue === 'credentials') {
      if (isCoiApprovalItemId(activeItemId)) {
        const guardId = guardIdFromCoiApprovalItemId(activeItemId);
        const guard =
          pendingInsuranceReviews.find((g) => g.id === guardId) ??
          guards.find((g) => g.id === guardId) ??
          null;
        if (!guard?.insurancePolicy) return null;
        const policy = guard.insurancePolicy;
        return (
          <ApprovalDetailScreen
            title={`${guard.name} — ${coiViewSectionLabel()}`}
            backLabel={activeTabLabel}
            onBack={() => setActiveItemId(null)}
          >
            <div className="staff-detail-pane space-y-4">
              <ApprovalReviewMeta item={feedItem} />
              <CoiCredentialBadge />
              <p className="text-sm text-brand-text-muted">
                {coiViewSectionLabel()} · {formatCoiSummaryLine(policy)}
              </p>
              <div className="app-action-row--equal">
                {policy.documentUrl && (
                  <button
                    type="button"
                    onClick={() => setViewCoi(guard)}
                    className="app-button-outline app-btn-sm gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View document
                  </button>
                )}
                {onViewGuard && (
                  <button
                    type="button"
                    onClick={() => onViewGuard(guard.id)}
                    className="app-button-outline app-btn-sm"
                  >
                    Full profile
                  </button>
                )}
                {canVerifyGuardCredentials && onReviewGuardInsurance && policy.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      disabled={actionPending}
                      onClick={() =>
                        void runGuardedAction(
                          async () => {
                            await onReviewGuardInsurance(guard.id, 'rejected', 'Document needs correction');
                            setActiveItemId(null);
                          },
                          (message) => showAppToast(message || 'Could not reject COI.', { tone: 'error' })
                        )
                      }
                      className="app-button-outline app-btn-sm text-red-400 border-red-500/40 disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      type="button"
                      disabled={actionPending}
                      onClick={() =>
                        void runGuardedAction(
                          async () => {
                            await onReviewGuardInsurance(guard.id, 'verified');
                            setActiveItemId(null);
                          },
                          (message) => showAppToast(message || 'Could not verify COI.', { tone: 'error' })
                        )
                      }
                      className="app-button-primary app-btn-sm disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Verify
                    </button>
                  </>
                )}
              </div>
            </div>
          </ApprovalDetailScreen>
        );
      }
      const guardWithCert = guards
        .map((guard) => ({
          guard,
          cert: guard.certifications.find((c) => c.id === activeItemId),
        }))
        .find((entry) => entry.cert);
      if (!guardWithCert?.cert) return null;
      const { guard, cert } = guardWithCert;
      return (
        <ApprovalDetailScreen
          title={`${guard.name} — ${certDisplayName(cert)}`}
          backLabel={activeTabLabel}
          onBack={() => setActiveItemId(null)}
        >
          <div className="staff-detail-pane space-y-4">
            <ApprovalReviewMeta item={feedItem} />
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
              {canVerifyGuardCredentials && cert.status === 'pending' && cert.imageUrl && onRequestCertImageResubmit && (
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
              {canVerifyGuardCredentials && cert.status === 'pending' && (
                <>
                  <button
                    type="button"
                    disabled={actionPending}
                    onClick={() => void runGuardedAction(async () => onRejectCert(guard.id, cert.id))}
                    className="app-button-outline app-btn-sm text-red-400 border-red-500/40 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    type="button"
                    disabled={actionPending || !staffCanVerifyCertification(cert)}
                    title={staffVerifyCertificationBlocker(cert) ?? 'Verify credential'}
                    onClick={() =>
                      void runGuardedAction(
                        async () => {
                          await onApproveCert(guard.id, cert.id);
                          setActiveItemId(null);
                        },
                        (message) => showAppToast(message || 'Could not verify credential.', { tone: 'error' })
                      )
                    }
                    className="app-button-primary app-btn-sm disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> Verify
                  </button>
                </>
              )}
            </div>
            {cert.status === 'pending' && staffVerifyCertificationBlocker(cert) && (
              <p className="text-xs text-amber-500 leading-relaxed">
                {staffVerifyCertificationBlocker(cert)}
              </p>
            )}
          </div>
        </ApprovalDetailScreen>
      );
    }

    if (effectiveQueue === 'guard-accounts') {
      const guard = guards.find((g) => g.id === activeItemId) ?? null;
      if (!guard) return null;

      const checklist = getGuardActivationChecklist(guard);
      const isApprovedGuard = isGuardAccountApproved(guard);
      const approvalBlockers = isApprovedGuard ? checklist.staffActivationBlockers : checklist.staffApprovalBlockers;
      const canTakeAction = isApprovedGuard
        ? guardCanStaffActivateAccount(guard)
        : guardCanStaffApproveProfile(guard);
      const isPendingProfile = feedItem?.status === 'pending';
      const isApprovedAwaitingActivation = feedItem?.status === 'approved' && !isGuardUserStatusActive(guard);

      return (
        <ApprovalDetailScreen
          title={guard.name}
          backLabel={activeTabLabel}
          onBack={() => setActiveItemId(null)}
        >
          <div className="staff-detail-pane space-y-4">
            <ApprovalReviewMeta item={feedItem} />
            <p className="text-sm text-brand-text-muted">{guard.email}</p>
            <p className="text-xs text-brand-text-muted">
              {isApprovedGuard ? 'Guard account activation' : 'Guard profile approval'}
            </p>
            <StaffGuardActivationChecklistView guard={guard} />
            {isPendingProfile && approvalBlockers.length > 0 && (
              <div className="text-sm text-amber-400 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2 leading-relaxed space-y-1">
                <p className="font-semibold">Before you can approve:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5">
                  {approvalBlockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              </div>
            )}
            {isApprovedAwaitingActivation && approvalBlockers.length > 0 && (
              <div className="text-sm text-amber-400 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2 leading-relaxed space-y-1">
                <p className="font-semibold">Before you can activate:</p>
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
                  ? (status, rejectionReason) =>
                      Promise.resolve(onReviewGuardInsurance(guard.id, status, rejectionReason))
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
              {isApprovedAwaitingActivation && canActivateGuardAccounts && onActivateGuardAccount && (
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
                        showAppToast(
                          err instanceof Error ? err.message : 'Could not grant marketplace eligibility.',
                          { tone: 'error' }
                        );
                      }
                    })();
                  }}
                  className="app-button-primary app-btn-sm gap-1 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" /> Grant eligibility
                </button>
              )}
            </div>
            {isPendingProfile && canApproveGuardAccounts && onApproveGuardAccount && (
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

    if (effectiveQueue === 'client-accounts') {
      const client = clients.find((c) => c.id === activeItemId) ?? null;
      if (!client) return null;

      const isPending = feedItem?.status === 'pending';
      const budgetLabel: Record<string, string> = {
        'under-500': 'Under $500',
        '500-2000': '$500 – $2,000',
        '2000-5000': '$2,000 – $5,000',
        '5000-15000': '$5,000 – $15,000',
        '15000+': '$15,000+',
        ongoing: 'Ongoing / monthly contract',
      };
      const frequencyLabel: Record<string, string> = {
        'one-time': 'One-time event',
        recurring: 'Ongoing / recurring',
        temporary: 'Temporary / short-term',
      };
      const armedLabel: Record<string, string> = {
        armed: 'Armed',
        unarmed: 'Unarmed',
        'no-preference': 'No preference',
      };

      return (
        <ApprovalDetailScreen
          title={client.companyName || client.name}
          backLabel={activeTabLabel}
          onBack={() => setActiveItemId(null)}
        >
          <div className="staff-detail-pane space-y-5">
            <ApprovalReviewMeta item={feedItem} />

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
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-primary hover:underline truncate"
                    >
                      {client.website}
                    </a>
                  </p>
                )}
              </div>
            </section>

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
                        <span
                          key={ind}
                          className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-primary/15 text-brand-primary border border-brand-primary/30"
                        >
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

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
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-primary/15 text-brand-primary border border-brand-primary/30"
                    >
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
                        <span
                          key={pt}
                          className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-primary/15 text-brand-primary border border-brand-primary/30"
                        >
                          {pt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

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

            {isPending && onApproveClient && (
              <div className="pt-3 border-t border-brand-border">
                <button
                  type="button"
                  disabled={actionPending}
                  onClick={() =>
                    void runGuardedAction(async () => {
                      onApproveClient(client.id);
                      setActiveItemId(null);
                    })
                  }
                  className="app-button-primary app-btn-sm gap-1 disabled:opacity-50"
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
  };

  return (
    <div className="animate-fade-in space-y-4">
      {permittedQueues.length === 0 ? (
        <AppEmptyState dashed icon={<ClipboardCheck className="w-5 h-5" />} title="All clear">
          Nothing is waiting for approval right now.
        </AppEmptyState>
      ) : (
        <>
          {!activeItemId && renderApprovalsTabs()}
          {renderQueueList()}
        </>
      )}

      {viewCert && (
        <CertDetailModal
          cert={viewCert.cert}
          guardName={viewCert.guard.name}
          onClose={() => setViewCert(null)}
        />
      )}

      {viewCoi && (
        <GuardCoiDetailModal
          guard={viewCoi}
          guardName={viewCoi.name}
          staffMode
          onClose={() => setViewCoi(null)}
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
