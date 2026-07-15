import React, { useEffect, useMemo, useState } from 'react';
import {
  Client,
  GuardStandingCrewMember,
  SecurityGuard,
  SecurityRequest,
} from '../../types';
import { loadAuditLog } from '../../lib/auditLog';
import {
  buildApplicationFeed,
  findFeedItem,
  formatApprovalTimestamp,
  type ApprovalFeedItem,
} from '../../lib/staffApprovalsFeed';
import { AppEmptyState, AppItemCardStack, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { WfBadge } from '../ui/wireframe';
import { Building2, Eye, Shield, UserCheck } from 'lucide-react';
import { StaffGuardDetailPanel } from './StaffGuardDetailPanel';
import { StaffClientDetailPanel } from './StaffClientDetailPanel';

type ApplicationKind = 'guard' | 'client';

interface StaffApplicationsProps {
  guards: SecurityGuard[];
  clients: Client[];
  requests: SecurityRequest[];
  standingCrewMembers?: GuardStandingCrewMember[];
  canApproveGuardAccounts?: boolean;
  canActivateGuardAccounts?: boolean;
  canManageGuardAccounts?: boolean;
  canManageClientAccounts?: boolean;
  canVerifyCredentials?: boolean;
  canSuspend?: boolean;
  onApproveGuardAccount?: (guardId: string) => void | Promise<void>;
  onActivateGuardAccount?: (
    guardId: string,
    options?: import('../../lib/guardMissingCredentials').ActivateGuardAccountOptions
  ) => void | Promise<void>;
  onApproveClient: (clientId: string) => void | Promise<void>;
  onRejectClient: (clientId: string) => void | Promise<void>;
  onUpdateGuardUserStatus?: (guardId: string, status: 'active' | 'suspended' | 'blocked') => void;
  onApproveCert?: (guardId: string, certId: string) => void;
  onRejectCert?: (guardId: string, certId: string) => void;
  onDeleteGuardAccount?: (guardId: string) => void | Promise<void>;
  onDeleteClientAccount?: (clientId: string) => void | Promise<void>;
  onOpenJob?: (jobId: string) => void;
  initialGuardId?: string | null;
  initialClientId?: string | null;
  onSelectionChange?: (selection: { guardId?: string | null; clientId?: string | null }) => void;
}

function resolveApplicationKind(
  item: ApprovalFeedItem,
  guards: SecurityGuard[],
  clients: Client[]
): ApplicationKind {
  if (guards.some((g) => g.id === item.id)) return 'guard';
  if (clients.some((c) => c.id === item.id)) return 'client';
  return 'guard';
}

function ApplicationFeedRow({
  item,
  kind,
  onViewDetails,
}: {
  item: ApprovalFeedItem;
  kind: ApplicationKind;
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
        <div className="flex items-center gap-2 min-w-0">
          <WfBadge tone={kind === 'guard' ? 'primary' : 'default'}>
            {kind === 'guard' ? 'Guard' : 'Client'}
          </WfBadge>
          <p className="font-semibold text-sm truncate">{item.title}</p>
        </div>
        {item.subtitle && <p className="text-xs text-brand-text-muted mt-0.5 truncate">{item.subtitle}</p>}
        <div className="mt-1.5 space-y-1">
          <WfBadge tone={tone}>{item.statusLabel}</WfBadge>
          {item.submittedAt && (item.status === 'pending' || item.status === 'in_review' || item.status === 'approved') && (
            <p className="text-[11px] text-brand-text-muted">
              Submitted {formatApprovalTimestamp(item.submittedAt)}
            </p>
          )}
        </div>
      </div>
      <button type="button" onClick={onViewDetails} className="app-button-outline app-btn-sm gap-1.5 w-fit">
        <Eye className="w-3.5 h-3.5" />
        Review application
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
  guards,
  clients,
  requests,
  standingCrewMembers = [],
  canApproveGuardAccounts = false,
  canActivateGuardAccounts = false,
  canManageGuardAccounts = false,
  canManageClientAccounts = false,
  canVerifyCredentials = false,
  canSuspend = false,
  onApproveGuardAccount,
  onActivateGuardAccount,
  onApproveClient,
  onRejectClient,
  onUpdateGuardUserStatus,
  onApproveCert,
  onRejectCert,
  onDeleteGuardAccount,
  onDeleteClientAccount,
  onOpenJob,
  initialGuardId = null,
  initialClientId = null,
  onSelectionChange,
}: StaffApplicationsProps) {
  const [activeSelection, setActiveSelection] = useState<{
    kind: ApplicationKind;
    id: string;
  } | null>(() => {
    if (initialGuardId) return { kind: 'guard', id: initialGuardId };
    if (initialClientId) return { kind: 'client', id: initialClientId };
    return null;
  });
  const [auditLog, setAuditLog] = useState<Awaited<ReturnType<typeof loadAuditLog>>>([]);

  useEffect(() => {
    let cancelled = false;
    void loadAuditLog(400).then((entries) => {
      if (!cancelled) setAuditLog(entries);
    });
    return () => {
      cancelled = true;
    };
  }, [guards, clients]);

  useEffect(() => {
    if (initialGuardId) setActiveSelection({ kind: 'guard', id: initialGuardId });
    else if (initialClientId) setActiveSelection({ kind: 'client', id: initialClientId });
  }, [initialGuardId, initialClientId]);

  const applicationFeed = useMemo(
    () => buildApplicationFeed(guards, clients, auditLog),
    [guards, clients, auditLog]
  );

  const feedById = useMemo(() => {
    const map = new Map<string, { item: ApprovalFeedItem; kind: ApplicationKind }>();
    for (const item of applicationFeed) {
      map.set(item.id, {
        item,
        kind: resolveApplicationKind(item, guards, clients),
      });
    }
    return map;
  }, [applicationFeed, guards, clients]);

  useEffect(() => {
    if (!activeSelection) return;
    if (!feedById.has(activeSelection.id)) {
      setActiveSelection(null);
      onSelectionChange?.({ guardId: null, clientId: null });
    }
  }, [activeSelection, feedById, onSelectionChange]);

  const canReview =
    (canApproveGuardAccounts || canActivateGuardAccounts || canManageGuardAccounts) ||
    canManageClientAccounts;

  const setSelection = (next: { kind: ApplicationKind; id: string } | null) => {
    setActiveSelection(next);
    onSelectionChange?.({
      guardId: next?.kind === 'guard' ? next.id : null,
      clientId: next?.kind === 'client' ? next.id : null,
    });
  };

  if (!canReview) {
    return (
      <AppEmptyState dashed icon={<UserCheck className="w-5 h-5" />} title="No access">
        Your role cannot review account applications.
      </AppEmptyState>
    );
  }

  if (activeSelection) {
    const entry = feedById.get(activeSelection.id);
    const feedItem = entry?.item ?? findFeedItem(applicationFeed, activeSelection.id);
    const kind = entry?.kind ?? activeSelection.kind;

    if (kind === 'guard') {
      const guard = guards.find((g) => g.id === activeSelection.id);
      if (!guard) return null;

      return (
        <div className="-mx-4 sm:-mx-5 app-full-page-detail animate-fade-in" data-tour="staff-applications">
          <AppSubScreenHeader
            title={guard.name}
            onBack={() => setSelection(null)}
            backLabel="Applications"
          />
          <div className="px-4 sm:px-5 pb-8 space-y-4">
            <ApplicationReviewMeta item={feedItem} />
            <StaffGuardDetailPanel
              guard={guard}
              requests={requests}
              standingCrewMembers={standingCrewMembers}
              canManage={canManageGuardAccounts}
              canVerifyCredentials={canVerifyCredentials}
              canSuspend={canSuspend}
              onUpdateUserStatus={onUpdateGuardUserStatus ?? (() => {})}
              onApproveCert={onApproveCert ?? (() => {})}
              onRejectCert={onRejectCert ?? (() => {})}
              onApproveGuardAccount={canApproveGuardAccounts ? onApproveGuardAccount : undefined}
              onActivateGuardAccount={canActivateGuardAccounts ? onActivateGuardAccount : undefined}
              onDeleteGuard={canManageGuardAccounts ? onDeleteGuardAccount : undefined}
              onOpenJob={onOpenJob}
              compact
            />
          </div>
        </div>
      );
    }

    const client = clients.find((c) => c.id === activeSelection.id);
    if (!client) return null;

    return (
      <div className="-mx-4 sm:-mx-5 app-full-page-detail animate-fade-in" data-tour="staff-applications">
        <AppSubScreenHeader
          title={client.companyName || client.name}
          onBack={() => setSelection(null)}
          backLabel="Applications"
        />
        <div className="px-4 sm:px-5 pb-8 space-y-4">
          <ApplicationReviewMeta item={feedItem} />
          <StaffClientDetailPanel
            client={client}
            requests={requests}
            canManage={canManageClientAccounts}
            onApproveClient={onApproveClient}
            onRejectClient={onRejectClient}
            onDeleteClient={canManageClientAccounts ? onDeleteClientAccount : undefined}
            onOpenJob={onOpenJob}
            compact
          />
        </div>
      </div>
    );
  }

  const pendingGuardCount = applicationFeed.filter((item) => resolveApplicationKind(item, guards, clients) === 'guard').length;
  const pendingClientCount = applicationFeed.filter((item) => resolveApplicationKind(item, guards, clients) === 'client').length;

  return (
    <div className="animate-fade-in space-y-4" data-tour="staff-applications">
      <p className="text-sm text-brand-text-muted leading-relaxed">
        New guard and client sign-ups waiting for staff review before they can use the marketplace.
        Job applications go straight to the client on each job.
      </p>

      {applicationFeed.length === 0 ? (
        <AppEmptyState dashed icon={<UserCheck className="w-5 h-5" />} title="All clear">
          No account applications waiting for review.
        </AppEmptyState>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 text-xs text-brand-text-muted">
            {pendingGuardCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                {pendingGuardCount} guard{pendingGuardCount === 1 ? '' : 's'}
              </span>
            )}
            {pendingClientCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {pendingClientCount} client{pendingClientCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <AppItemCardStack>
            {applicationFeed.map((item) => {
              const kind = resolveApplicationKind(item, guards, clients);
              return (
                <ApplicationFeedRow
                  key={`${kind}-${item.id}`}
                  item={item}
                  kind={kind}
                  onViewDetails={() => setSelection({ kind, id: item.id })}
                />
              );
            })}
          </AppItemCardStack>
        </>
      )}
    </div>
  );
}
