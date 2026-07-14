import React, { useEffect, useMemo, useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { loadAuditLog } from '../../lib/auditLog';
import {
  buildApplicationFeed,
  findFeedItem,
  formatApprovalTimestamp,
  type ApprovalFeedItem,
} from '../../lib/staffApprovalsFeed';
import { guardMeetsJobRequirements, rankApplicantGuards } from '../../lib/jobApplications';
import { isAwaitingClientGuardApproval } from '../../lib/guardAssignment';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppEmptyState, AppItemCardStack, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { WfBadge, WfListCard } from '../ui/wireframe';
import { Eye, UserCheck } from 'lucide-react';

interface StaffApplicationsProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  onApproveGuardApplication: (requestId: string, guardId: string) => void;
  onDenyGuardApplication?: (requestId: string, guardId: string) => void | Promise<void>;
  canReviewJobRequests?: boolean;
  initialJobId?: string | null;
}

function ApplicationFeedRow({
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
    <div className="app-item-card flex-col !items-stretch gap-2.5 !cursor-default">
      <div className="min-w-0 text-left w-full">
        <p className="font-semibold text-sm truncate">{item.title}</p>
        {item.subtitle && <p className="text-xs text-brand-text-muted mt-0.5 truncate">{item.subtitle}</p>}
        <div className="mt-1.5 space-y-1">
          <WfBadge tone={tone}>{item.statusLabel}</WfBadge>
          {item.submittedAt && (item.status === 'pending' || item.status === 'in_review') && (
            <p className="text-[11px] text-brand-text-muted">
              Submitted {formatApprovalTimestamp(item.submittedAt)}
            </p>
          )}
        </div>
      </div>
      <button type="button" onClick={onViewDetails} className="app-button-outline app-btn-sm gap-1.5 w-fit">
        <Eye className="w-3.5 h-3.5" />
        Review applicants
      </button>
    </div>
  );
}

function ApplicationReviewMeta({ item }: { item?: ApprovalFeedItem }) {
  if (!item) return null;
  const reviewer = item.reviewedByName || item.reviewedByEmail;
  return (
    <div className="rounded-lg border border-brand-border bg-brand-bg-sec/40 px-3 py-2.5 text-xs space-y-1">
      <p>
        <span className="font-semibold text-brand-text">Status: </span>
        {item.statusLabel}
      </p>
      {item.submittedAt && (
        <p>
          <span className="font-semibold text-brand-text">Submitted: </span>
          {formatApprovalTimestamp(item.submittedAt)}
        </p>
      )}
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

export function StaffApplications({
  requests,
  guards,
  onApproveGuardApplication,
  onDenyGuardApplication,
  canReviewJobRequests = false,
  initialJobId = null,
}: StaffApplicationsProps) {
  const [activeJobId, setActiveJobId] = useState<string | null>(initialJobId);
  const [auditLog, setAuditLog] = useState<Awaited<ReturnType<typeof loadAuditLog>>>([]);

  useEffect(() => {
    let cancelled = false;
    void loadAuditLog(400).then((entries) => {
      if (!cancelled) setAuditLog(entries);
    });
    return () => {
      cancelled = true;
    };
  }, [requests, guards]);

  useEffect(() => {
    if (initialJobId) setActiveJobId(initialJobId);
  }, [initialJobId]);

  const applicationFeed = useMemo(
    () => buildApplicationFeed(requests, auditLog),
    [requests, auditLog]
  );

  useEffect(() => {
    if (!activeJobId) return;
    if (!findFeedItem(applicationFeed, activeJobId)) setActiveJobId(null);
  }, [activeJobId, applicationFeed]);

  useEffect(() => {
    if (!activeJobId) return;
    if (!requests.some((r) => r.id === activeJobId)) setActiveJobId(null);
  }, [activeJobId, requests]);

  if (!canReviewJobRequests) {
    return (
      <AppEmptyState dashed icon={<UserCheck className="w-5 h-5" />} title="No access">
        Your role cannot review guard applications.
      </AppEmptyState>
    );
  }

  if (activeJobId) {
    const req = requests.find((r) => r.id === activeJobId);
    const feedItem = findFeedItem(applicationFeed, activeJobId);
    if (!req) return null;

    const ranked = rankApplicantGuards(req, guards);
    const pendingGuard = req.pendingGuardId ? guards.find((g) => g.id === req.pendingGuardId) : undefined;
    const awaitingClientGuard = isAwaitingClientGuardApproval(req);
    const canActOnApplications =
      (feedItem?.status === 'pending' || feedItem?.status === 'in_review') &&
      req.status === 'open' &&
      !req.assignedGuardId;

    return (
      <div className="-mx-4 sm:-mx-5 app-full-page-detail animate-fade-in" data-tour="staff-applications">
        <AppSubScreenHeader
          title={req.title}
          onBack={() => setActiveJobId(null)}
          backLabel="Applications"
        />
        <div className="px-4 sm:px-5 pb-8 space-y-4">
          <div className="staff-detail-pane space-y-3">
            <ApplicationReviewMeta item={feedItem} />
            <p className="text-sm text-brand-text-muted">
              {req.clientName} · {req.location}
            </p>
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
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4" data-tour="staff-applications">
      {applicationFeed.length === 0 ? (
        <AppEmptyState dashed icon={<UserCheck className="w-5 h-5" />} title="All clear">
          No job applications waiting for staff review.
        </AppEmptyState>
      ) : (
        <AppItemCardStack>
          {applicationFeed.map((item) => (
            <ApplicationFeedRow
              key={item.id}
              item={item}
              onViewDetails={() => setActiveJobId(item.id)}
            />
          ))}
        </AppItemCardStack>
      )}
    </div>
  );
}
