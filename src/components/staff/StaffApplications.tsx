import React, { useEffect, useMemo, useState } from 'react';
import {
  Client,
  SecurityGuard,
  SessionUser,
} from '../../types';
import { isStaffMemberVisibleToViewer } from '../../lib/permissions';
import { loadAuditLog } from '../../lib/auditLog';
import {
  buildApplicationFeed,
  formatApprovalTimestamp,
  type ApprovalFeedItem,
} from '../../lib/staffApprovalsFeed';
import { applicationFeedItemMatchesSearch } from '../../lib/credentialSearch';
import {
  type ApplicationKindFilter,
  type ApplicationStatusFilter,
  matchesApplicationKindFilter,
  matchesApplicationStatusFilter,
} from '../../lib/staffListFilters';
import { AppEmptyState, AppItemCard, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { AppBlockedAccessScreen } from '../ui/app/AppBlockedAccess';
import { clientDisplayName } from '../../lib/clientType';
import { STAFF_SECTION_ACCESS_MESSAGES } from '../../lib/staffNavAccess';
import { ListDetailLayout, useSplitListDetail } from '../ui/app/ListDetailLayout';
import { WfBadge, WfSearchBar } from '../ui/wireframe';
import { Building2, ChevronRight, Search, Shield, UserCheck } from 'lucide-react';
import { StaffGuardApplicationReviewPanel } from './StaffGuardApplicationReviewPanel';
import { StaffClientApplicationReviewPanel } from './StaffClientApplicationReviewPanel';
import { StaffStaffApplicationReviewPanel } from './StaffStaffApplicationReviewPanel';
import { StaffAddGuardForm } from './StaffAddGuardForm';
import type { StaffAddGuardInput } from './StaffAddGuardForm';
import { StaffAddClientForm } from './StaffAddClientForm';
import type { StaffAddClientInput } from './StaffAddClientForm';
import { StaffListFilterTabs } from './StaffListFilterTabs';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import { useLayoutFormFactor } from '../../surfaces';
import { StatusChip, type StatusTone } from '../baseui/StatusChip';
import { GuardrDataTable, type GuardrTableColumn } from '../baseui/GuardrDataTable';
import {
  WorkbenchEmpty,
  WorkbenchSplit,
} from '../baseui/layout/WorkbenchLayout';

type ApplicationKind = 'client' | 'guard' | 'staff';

interface ApplicationListEntry {
  kind: ApplicationKind;
  item: ApprovalFeedItem;
}

interface StaffApplicationsProps {
  currentUser: SessionUser;
  guards: SecurityGuard[];
  clients: Client[];
  canApproveGuardAccounts?: boolean;
  canManageGuardAccounts?: boolean;
  canManageClientAccounts?: boolean;
  canApproveStaffAccounts?: boolean;
  onApproveGuardAccount?: (guardId: string) => void | Promise<void>;
  onApproveClient: (clientId: string) => void | Promise<void>;
  onRejectClient: (clientId: string) => void | Promise<void>;
  onRejectGuardApplication?: (guardId: string, reason?: string) => void | Promise<void>;
  onRequestGuardApplicationRevision?: (guardId: string, reason?: string) => void | Promise<void>;
  onRequestClientApplicationRevision?: (clientId: string, reason?: string) => void | Promise<void>;
  onApproveStaffAccount?: (staffId: string) => void | Promise<void>;
  onRejectStaffAccount?: (staffId: string) => void | Promise<void>;
  onOpenGuardProfile?: (guardId: string) => void;
  onOpenClientProfile?: (clientId: string) => void;
  onOpenStaffProfile?: (staffId: string) => void;
  onAddGuard?: (input: StaffAddGuardInput) => Promise<string>;
  onAddClient?: (input: StaffAddClientInput) => Promise<string>;
  initialGuardId?: string | null;
  initialClientId?: string | null;
  onSelectionChange?: (selection: {
    guardId?: string | null;
    clientId?: string | null;
    staffId?: string | null;
  }) => void;
}

function applicationKeyForIds(
  guards: SecurityGuard[],
  guardId?: string | null,
  clientId?: string | null
): string | null {
  if (guardId) {
    const member = guards.find((g) => g.id === guardId);
    return member?.isStaff ? `staff:${guardId}` : `guard:${guardId}`;
  }
  if (clientId) return `client:${clientId}`;
  return null;
}

function resolveApplicationKind(
  item: ApprovalFeedItem,
  guards: SecurityGuard[],
  clients: Client[]
): ApplicationKind {
  const guard = guards.find((g) => g.id === item.id);
  if (guard?.isStaff) return 'staff';
  if (guard) return 'guard';
  if (clients.some((c) => c.id === item.id)) return 'client';
  return 'guard';
}

function applicationListKey(entry: ApplicationListEntry): string {
  return `${entry.kind}:${entry.item.id}`;
}

function applicationKindLabel(kind: ApplicationKind): string {
  if (kind === 'guard') return 'Guard';
  if (kind === 'staff') return 'Staff';
  return 'Customer';
}

function applicationStatusTone(status: ApprovalFeedItem['status']): StatusTone {
  if (status === 'pending' || status === 'in_review') return 'warning';
  if (status === 'approved' || status === 'active') return 'positive';
  if (status === 'denied' || status === 'rejected') return 'negative';
  return 'neutral';
}

function ApplicationFeedRow({
  entry,
  isSelected,
  onSelect,
}: {
  entry: ApplicationListEntry;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { item, kind } = entry;
  const tone =
    item.status === 'pending' || item.status === 'in_review'
      ? 'warning'
      : item.status === 'approved' || item.status === 'active'
        ? 'success'
        : 'danger';
  const pending = item.status === 'pending' || item.status === 'in_review';

  return (
    <AppItemCard onClick={onSelect} className={isSelected ? 'app-item-card-selected' : ''}>
      <div className="flex items-start gap-3 w-full text-left">
        <span
          className={`staff-overview-action-icon ${
            pending ? 'staff-overview-action-icon-urgent' : ''
          }`}
        >
          {kind === 'guard' ? (
            <Shield className="w-4 h-4" />
          ) : kind === 'staff' ? (
            <UserCheck className="w-4 h-4" />
          ) : (
            <Building2 className="w-4 h-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <WfBadge tone={kind === 'guard' ? 'primary' : kind === 'staff' ? 'warning' : 'default'}>
              {kind === 'guard' ? 'Guard' : kind === 'staff' ? 'Staff' : 'Customer'}
            </WfBadge>
            <p className="uber-feed-row-title">{item.title}</p>
          </div>
          {item.subtitle && <p className="uber-feed-row-subtitle mt-1">{item.subtitle}</p>}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <WfBadge tone={tone}>{item.statusLabel}</WfBadge>
            {item.submittedAt && pending && (
              <span className="text-[11px] text-brand-text-muted">
                Submitted {formatApprovalTimestamp(item.submittedAt)}
              </span>
            )}
            {item.reviewedAt && !pending && (
              <span className="text-[11px] text-brand-text-muted">
                {item.status === 'active' ? 'Activated' : 'Reviewed'}{' '}
                {formatApprovalTimestamp(item.reviewedAt)}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-brand-text-muted shrink-0 mt-0.5" />
      </div>
    </AppItemCard>
  );
}

function ApplicationReviewMeta({ item }: { item?: ApprovalFeedItem }) {
  if (!item) return null;

  const pending = item.status === 'pending' || item.status === 'in_review';
  const approved = item.status === 'approved' || item.status === 'active';
  const denied = item.status === 'denied' || item.status === 'rejected';
  const approvedBy = item.approvedByEmail || item.approvedByName;
  const activatedBy = item.activatedByEmail || item.activatedByName;
  const fallbackReviewer = item.reviewedByEmail || item.reviewedByName;

  return (
    <div className="app-list-subrow text-xs space-y-2 !pt-0">
      <p>
        <span className="detail-field-label !mb-0">Status</span>
        <span className="text-sm font-medium">{item.statusLabel}</span>
      </p>
      {item.submittedAt && (
        <p>
          <span className="detail-field-label !mb-0">Submitted</span>
          <span className="text-sm">{formatApprovalTimestamp(item.submittedAt)}</span>
        </p>
      )}
      {(item.approvedAt || (approved && item.reviewedAt && !item.activatedAt)) && (
        <p>
          <span className="detail-field-label !mb-0">Approved</span>
          <span className="text-sm">
            {formatApprovalTimestamp(item.approvedAt ?? item.reviewedAt!)}
          </span>
        </p>
      )}
      {(approvedBy || (approved && fallbackReviewer && !activatedBy)) && (
        <p>
          <span className="detail-field-label !mb-0">Approved by</span>
          <span className="text-sm">{approvedBy || fallbackReviewer}</span>
        </p>
      )}
      {item.activatedAt && (
        <p>
          <span className="detail-field-label !mb-0">Activated</span>
          <span className="text-sm">{formatApprovalTimestamp(item.activatedAt)}</span>
        </p>
      )}
      {activatedBy && (
        <p>
          <span className="detail-field-label !mb-0">Activated by</span>
          <span className="text-sm">{activatedBy}</span>
        </p>
      )}
      {item.reviewedAt && denied && (
        <p>
          <span className="detail-field-label !mb-0">Reviewed</span>
          <span className="text-sm">{formatApprovalTimestamp(item.reviewedAt)}</span>
        </p>
      )}
      {fallbackReviewer && denied && (
        <p>
          <span className="detail-field-label !mb-0">Reviewed by</span>
          <span className="text-sm">{fallbackReviewer}</span>
        </p>
      )}
      {!approvedBy && !activatedBy && !fallbackReviewer && !pending && approved && (
        <p className="text-sm text-brand-text-muted">
          Approver details are not on file for this application.
        </p>
      )}
    </div>
  );
}

export function StaffApplications({
  currentUser,
  guards,
  clients,
  canApproveGuardAccounts = false,
  canManageGuardAccounts = false,
  canManageClientAccounts = false,
  canApproveStaffAccounts = false,
  onApproveGuardAccount,
  onApproveClient,
  onRejectClient,
  onRejectGuardApplication,
  onRequestGuardApplicationRevision,
  onRequestClientApplicationRevision,
  onApproveStaffAccount,
  onRejectStaffAccount,
  onOpenGuardProfile,
  onOpenClientProfile,
  onOpenStaffProfile,
  onAddGuard,
  onAddClient,
  initialGuardId = null,
  initialClientId = null,
  onSelectionChange,
}: StaffApplicationsProps) {
  const formFactor = useLayoutFormFactor();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatusFilter>('all');
  const [kindFilter, setKindFilter] = useState<ApplicationKindFilter>('all');
  const [search, setSearch] = useState('');
  const [activeItemKey, setActiveItemKey] = useState<string | null>(() =>
    applicationKeyForIds(guards, initialGuardId, initialClientId)
  );
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

  const applicationFeed = useMemo(
    () => buildApplicationFeed(guards, clients, auditLog),
    [guards, clients, auditLog]
  );

  const applicationEntries = useMemo(
    () =>
      applicationFeed.map((item) => ({
        kind: resolveApplicationKind(item, guards, clients),
        item,
      })),
    [applicationFeed, guards, clients]
  );

  const feedByKey = useMemo(() => {
    const map = new Map<string, ApplicationListEntry>();
    for (const entry of applicationEntries) {
      map.set(applicationListKey(entry), entry);
    }
    return map;
  }, [applicationEntries]);

  useEffect(() => {
    const nextKey = applicationKeyForIds(guards, initialGuardId, initialClientId);
    if (nextKey) setActiveItemKey(nextKey);
  }, [initialGuardId, initialClientId, guards]);

  useEffect(() => {
    if (!activeItemKey) return;
    if (!feedByKey.has(activeItemKey)) {
      setActiveItemKey(null);
      onSelectionChange?.({ guardId: null, clientId: null, staffId: null });
    }
  }, [activeItemKey, feedByKey, onSelectionChange]);

  const canReview =
    canApproveGuardAccounts ||
    canManageGuardAccounts ||
    canManageClientAccounts ||
    canApproveStaffAccounts;

  const visibleEntries = useMemo(() => {
    return applicationEntries
      .filter((entry) => {
        if (entry.kind !== 'staff') return true;
        const member = guards.find((guard) => guard.id === entry.item.id && guard.isStaff);
        return isStaffMemberVisibleToViewer(currentUser, member);
      })
      .filter((entry) => matchesApplicationKindFilter(entry.kind, kindFilter))
      .filter((entry) =>
        matchesApplicationStatusFilter(entry.item, statusFilter, guards, clients)
      )
      .filter((entry) => applicationFeedItemMatchesSearch(entry.item, search));
  }, [applicationEntries, kindFilter, statusFilter, guards, clients, search, currentUser]);

  const activeEntry = activeItemKey ? feedByKey.get(activeItemKey) ?? null : null;

  const setSelection = (entry: ApplicationListEntry | null) => {
    const key = entry ? applicationListKey(entry) : null;
    setActiveItemKey(key);
    onSelectionChange?.({
      guardId: entry?.kind === 'guard' || entry?.kind === 'staff' ? entry.item.id : null,
      clientId: entry?.kind === 'client' ? entry.item.id : null,
      staffId: entry?.kind === 'staff' ? entry.item.id : null,
    });
  };

  useEffect(() => {
    if (formFactor === 'mobile') return;
    if (visibleEntries.length === 0) {
      if (activeItemKey) setSelection(null);
      return;
    }
    const stillVisible = activeItemKey ? feedByKey.has(activeItemKey) : false;
    if (!stillVisible) setSelection(visibleEntries[0]);
  }, [statusFilter, kindFilter, visibleEntries, activeItemKey, formFactor]);

  const applicationColumns: GuardrTableColumn<ApplicationListEntry>[] = useMemo(
    () => [
      {
        id: 'type',
        header: 'Type',
        sortValue: (entry) => entry.kind,
        render: (entry) => applicationKindLabel(entry.kind),
      },
      {
        id: 'applicant',
        header: 'Applicant',
        grow: true,
        sortValue: (entry) => entry.item.title.toLowerCase(),
        render: (entry) => (
          <>
            <p className="uber-workbench-table-primary">{entry.item.title}</p>
            {entry.item.subtitle ? (
              <p className="uber-workbench-table-secondary">{entry.item.subtitle}</p>
            ) : null}
          </>
        ),
      },
      {
        id: 'submitted',
        header: 'Submitted',
        hideOnNarrow: true,
        sortValue: (entry) => entry.item.submittedAt ?? '',
        render: (entry) =>
          entry.item.submittedAt ? formatApprovalTimestamp(entry.item.submittedAt) : '—',
      },
      {
        id: 'status',
        header: 'Status',
        sortValue: (entry) => entry.item.status,
        render: (entry) => (
          <StatusChip tone={applicationStatusTone(entry.item.status)}>{entry.item.statusLabel}</StatusChip>
        ),
      },
    ],
    [],
  );

  const { showDetailOnly } = useSplitListDetail(activeItemKey, 'page');

  const renderApplicationDetail = (entry: ApplicationListEntry, options?: { onBack?: () => void }) => {
    const feedItem = entry.item;
    const { kind } = entry;

    if (kind === 'staff') {
      const member = guards.find((g) => g.id === entry.item.id && g.isStaff);
      if (!member) return null;
      const title = member.badgeNumber || member.name || feedItem.title;
      const detailBody = (
        <div className="staff-detail-pane space-y-4">
          <ApplicationReviewMeta item={feedItem} />
          <StaffStaffApplicationReviewPanel
            member={member}
            canReview={canApproveStaffAccounts}
            onApproveStaffAccount={canApproveStaffAccounts ? onApproveStaffAccount : undefined}
            onRejectStaffAccount={canApproveStaffAccounts ? onRejectStaffAccount : undefined}
            onOpenStaffProfile={
              isStaffMemberVisibleToViewer(currentUser, member) ? onOpenStaffProfile : undefined
            }
          />
        </div>
      );

      if (options?.onBack) {
        return (
          <div className="app-full-page-detail animate-fade-in min-w-0 max-w-full">
            <AppSubScreenHeader title={title} onBack={options.onBack} backLabel="Applications" hideTitle />
            <div className="pb-8 min-w-0">{detailBody}</div>
          </div>
        );
      }

      return (
        <div className="animate-fade-in">
          <div className="app-dashboard-zone-head !px-0 !mb-3">
            <h2 className="app-dashboard-zone-title break-words">{title}</h2>
          </div>
          {detailBody}
        </div>
      );
    }

    if (kind === 'guard') {
      const guard = guards.find((g) => g.id === entry.item.id);
      if (!guard) return null;

      const detailBody = (
        <div className="staff-detail-pane space-y-4">
          <ApplicationReviewMeta item={feedItem} />
          <StaffGuardApplicationReviewPanel
            guard={guard}
            canReview={canApproveGuardAccounts || canManageGuardAccounts}
            onApproveGuardAccount={canApproveGuardAccounts ? onApproveGuardAccount : undefined}
            onRejectGuardApplication={onRejectGuardApplication}
            onRequestGuardApplicationRevision={
              canApproveGuardAccounts || canManageGuardAccounts
                ? onRequestGuardApplicationRevision
                : undefined
            }
            onOpenGuardProfile={onOpenGuardProfile}
          />
        </div>
      );

      if (options?.onBack) {
        return (
          <div className="app-full-page-detail animate-fade-in min-w-0 max-w-full">
            <AppSubScreenHeader title={guard.name} onBack={options.onBack} backLabel="Applications" hideTitle />
            <div className="pb-8 min-w-0">{detailBody}</div>
          </div>
        );
      }

      return (
        <div className="animate-fade-in">
          <div className="app-dashboard-zone-head !px-0 !mb-3">
            <h2 className="app-dashboard-zone-title break-words">{guard.name}</h2>
          </div>
          {detailBody}
        </div>
      );
    }

    const client = clients.find((c) => c.id === entry.item.id);
    if (!client) return null;

    const detailBody = (
      <div className="staff-detail-pane space-y-4">
        <ApplicationReviewMeta item={feedItem} />
        <StaffClientApplicationReviewPanel
          client={client}
          canReview={canManageClientAccounts}
          onApproveClient={onApproveClient}
          onRejectClient={onRejectClient}
          onRequestClientApplicationRevision={
            canManageClientAccounts ? onRequestClientApplicationRevision : undefined
          }
          onOpenClientProfile={onOpenClientProfile}
        />
      </div>
    );

    if (options?.onBack) {
      return (
        <div className="app-full-page-detail animate-fade-in min-w-0 max-w-full">
          <AppSubScreenHeader
            title={clientDisplayName(client)}
            onBack={options.onBack}
            backLabel="Applications"
            hideTitle
          />
          <div className="pb-8 min-w-0">{detailBody}</div>
        </div>
      );
    }

    return (
      <div className="animate-fade-in">
        <div className="app-dashboard-zone-head !px-0 !mb-3">
          <h2 className="app-dashboard-zone-title break-words">{clientDisplayName(client)}</h2>
        </div>
        {detailBody}
      </div>
    );
  };

  if (!canReview) {
    return (
      <AppBlockedAccessScreen
        title={STAFF_SECTION_ACCESS_MESSAGES.applications!.title}
        message={STAFF_SECTION_ACCESS_MESSAGES.applications!.message}
        placeholders={['Search applications', 'Pending review', 'Guard applications', 'Client applications']}
      />
    );
  }

  const toolbar = !showDetailOnly ? (
    <>
      <div className="staff-ops-cta-stack">
        {canManageGuardAccounts && onAddGuard && (
          <StaffAddGuardForm
            onAdd={onAddGuard}
            onCreated={(guardId) => {
              setSearch('');
              setStatusFilter('pending');
              setKindFilter('guard');
              setActiveItemKey(`guard:${guardId}`);
              onSelectionChange?.({ guardId, clientId: null });
            }}
          />
        )}
        {canManageClientAccounts && onAddClient && (
          <StaffAddClientForm
            onAdd={onAddClient}
            onCreated={(clientId) => {
              setSearch('');
              setStatusFilter('pending');
              setKindFilter('client');
              setActiveItemKey(`client:${clientId}`);
              onSelectionChange?.({ guardId: null, clientId });
            }}
          />
        )}
      </div>
      <WfSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search applications..."
        className="max-w-md"
      />
      <div className="space-y-2">
        <StaffListFilterTabs
          aria-label="Show all applications"
          activeId={kindFilter === 'all' || statusFilter === 'all' ? 'all' : '__none__'}
          onChange={(id) => {
            if (id === 'all') {
              setKindFilter('all');
              setStatusFilter('all');
            }
          }}
          tabs={[{ id: 'all', label: 'All' }]}
        />
        <StaffListFilterTabs
          aria-label="Application type"
          activeId={kindFilter === 'all' ? '__none__' : kindFilter}
          onChange={(id) => {
            if (id === '__none__') return;
            setKindFilter((current) =>
              current === id ? 'all' : (id as ApplicationKindFilter)
            );
          }}
          tabs={[
            { id: 'client', label: 'Customer' },
            { id: 'guard', label: 'Guard' },
            { id: 'staff', label: 'Staff' },
          ]}
        />
        <StaffListFilterTabs
          aria-label="Application status"
          activeId={statusFilter === 'all' ? '__none__' : statusFilter}
          onChange={(id) => {
            if (id === '__none__') return;
            setStatusFilter((current) =>
              current === id ? 'all' : (id as ApplicationStatusFilter)
            );
          }}
          tabs={[
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'denied', label: 'Denied' },
          ]}
        />
      </div>
    </>
  ) : null;

  if (formFactor === 'desktop') {
    return (
      <StaffOpsPageShell toolbar={toolbar} className="staff-roster-panel" data-tour="staff-applications">
        <WorkbenchSplit
          list={
            visibleEntries.length === 0 ? (
              <WorkbenchEmpty
                icon={search ? Search : UserCheck}
                message={search.trim() ? 'No applications match your search' : 'No applications in this view'}
              />
            ) : (
              <GuardrDataTable
                columns={applicationColumns}
                rows={visibleEntries}
                rowKey={applicationListKey}
                selectedKey={activeItemKey ?? undefined}
                onRowClick={(entry) => setSelection(entry)}
                caption="Applications"
                cardLayout={{ title: 'applicant', subtitle: 'submitted', trailing: 'status' }}
              />
            )
          }
          detail={
            activeEntry ? (
              renderApplicationDetail(activeEntry)
            ) : (
              <WorkbenchEmpty icon={UserCheck} message="Select an application to review" variant="detail" />
            )
          }
        />
      </StaffOpsPageShell>
    );
  }

  return (
    <StaffOpsPageShell toolbar={toolbar} className="staff-roster-panel" data-tour="staff-applications">
      {visibleEntries.length === 0 ? (
        <AppEmptyState dashed icon={<UserCheck className="w-5 h-5" />} title="All clear">
          {search.trim()
            ? 'No applications match your search.'
            : kindFilter === 'staff'
              ? statusFilter === 'pending'
                ? 'No staff applications waiting for Director approval.'
                : statusFilter === 'approved'
                  ? 'No approved staff applications in this view.'
                  : statusFilter === 'denied'
                    ? 'No denied staff applications in this view.'
                    : 'No staff applications in this view.'
              : statusFilter === 'all'
                ? 'No account applications in this view.'
                : statusFilter === 'pending'
                  ? 'No account applications waiting for review.'
                  : statusFilter === 'approved'
                    ? 'No approved applications in this view.'
                    : 'No denied applications in this view.'}
        </AppEmptyState>
      ) : (
        <ListDetailLayout
          items={visibleEntries}
          selectedId={activeItemKey}
          onSelectId={(key) => {
            if (!key) {
              setSelection(null);
              return;
            }
            setSelection(feedByKey.get(key) ?? null);
          }}
          getItemId={applicationListKey}
          listScrollClassName="max-h-[75vh] overflow-y-auto pr-1"
          detailClassName="staff-detail-pane"
          mobilePresentation="page"
          autoSelectFirst={formFactor === 'tablet'}
          emptyDetail={
            <div className="flex items-center justify-center h-full min-h-[40vh] p-8 text-center">
              <p className="text-sm text-brand-text-muted">Select an application to review</p>
            </div>
          }
          renderItem={(entry, isSelected, onSelect) => (
            <ApplicationFeedRow entry={entry} isSelected={isSelected} onSelect={onSelect} />
          )}
          renderDetail={(entry, options) => renderApplicationDetail(entry, options)}
        />
      )}
    </StaffOpsPageShell>
  );
}
