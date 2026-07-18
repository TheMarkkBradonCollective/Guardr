import React, { useEffect, useMemo, useState } from 'react';
import {
  Client,
  SecurityGuard,
} from '../../types';
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
import { STAFF_SECTION_ACCESS_MESSAGES } from '../../lib/staffNavAccess';
import { ListDetailLayout, useSplitListDetail } from '../ui/app/ListDetailLayout';
import { WfBadge, WfSearchBar } from '../ui/wireframe';
import { Building2, ChevronRight, Shield, UserCheck } from 'lucide-react';
import { StaffGuardApplicationReviewPanel } from './StaffGuardApplicationReviewPanel';
import { StaffClientApplicationReviewPanel } from './StaffClientApplicationReviewPanel';
import { StaffAddGuardForm } from './StaffAddGuardForm';
import type { StaffAddGuardInput } from './StaffAddGuardForm';
import { StaffAddClientForm } from './StaffAddClientForm';
import type { StaffAddClientInput } from './StaffAddClientForm';
import { StaffListFilterTabs } from './StaffListFilterTabs';
import { StaffOpsPageShell } from './StaffOpsPageShell';

type ApplicationKind = 'guard' | 'client';

interface ApplicationListEntry {
  kind: ApplicationKind;
  item: ApprovalFeedItem;
}

interface StaffApplicationsProps {
  guards: SecurityGuard[];
  clients: Client[];
  canApproveGuardAccounts?: boolean;
  canManageGuardAccounts?: boolean;
  canManageClientAccounts?: boolean;
  onApproveGuardAccount?: (guardId: string) => void | Promise<void>;
  onApproveClient: (clientId: string) => void | Promise<void>;
  onRejectClient: (clientId: string) => void | Promise<void>;
  onRejectGuardApplication?: (guardId: string, reason?: string) => void | Promise<void>;
  onOpenGuardProfile?: (guardId: string) => void;
  onOpenClientProfile?: (clientId: string) => void;
  onAddGuard?: (input: StaffAddGuardInput) => Promise<string>;
  onAddClient?: (input: StaffAddClientInput) => Promise<string>;
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

function applicationListKey(entry: ApplicationListEntry): string {
  return `${entry.kind}:${entry.item.id}`;
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
          {kind === 'guard' ? <Shield className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <WfBadge tone={kind === 'guard' ? 'primary' : 'default'}>
              {kind === 'guard' ? 'Guard' : 'Client'}
            </WfBadge>
            <p className="text-sm font-semibold truncate">{item.title}</p>
          </div>
          {item.subtitle && <p className="text-xs text-brand-text-muted mt-1 truncate">{item.subtitle}</p>}
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

  const reviewer = item.reviewedByName || item.reviewedByEmail;
  const pending = item.status === 'pending' || item.status === 'in_review';
  const approved = item.status === 'approved' || item.status === 'active';
  const denied = item.status === 'denied';

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
      {item.reviewedAt && !pending && (
        <p>
          <span className="detail-field-label !mb-0">
            {item.status === 'active' ? 'Activated' : approved ? 'Approved' : denied ? 'Reviewed' : 'Reviewed'}
          </span>
          <span className="text-sm">{formatApprovalTimestamp(item.reviewedAt)}</span>
        </p>
      )}
      {reviewer && !pending && (
        <p>
          <span className="detail-field-label !mb-0">
            {item.status === 'active' ? 'Activated by' : approved ? 'Approved by' : 'Reviewed by'}
          </span>
          <span className="text-sm">{item.reviewedByEmail || reviewer}</span>
        </p>
      )}
      {!reviewer && !pending && approved && (
        <p className="text-sm text-brand-text-muted">Approver details are not on file for this application.</p>
      )}
    </div>
  );
}

export function StaffApplications({
  guards,
  clients,
  canApproveGuardAccounts = false,
  canManageGuardAccounts = false,
  canManageClientAccounts = false,
  onApproveGuardAccount,
  onApproveClient,
  onRejectClient,
  onRejectGuardApplication,
  onOpenGuardProfile,
  onOpenClientProfile,
  onAddGuard,
  onAddClient,
  initialGuardId = null,
  initialClientId = null,
  onSelectionChange,
}: StaffApplicationsProps) {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatusFilter>('pending');
  const [kindFilter, setKindFilter] = useState<ApplicationKindFilter>('all');
  const [search, setSearch] = useState('');
  const [activeItemKey, setActiveItemKey] = useState<string | null>(() => {
    if (initialGuardId) return `guard:${initialGuardId}`;
    if (initialClientId) return `client:${initialClientId}`;
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
    if (initialGuardId) setActiveItemKey(`guard:${initialGuardId}`);
    else if (initialClientId) setActiveItemKey(`client:${initialClientId}`);
  }, [initialGuardId, initialClientId]);

  useEffect(() => {
    if (!activeItemKey) return;
    if (!feedByKey.has(activeItemKey)) {
      setActiveItemKey(null);
      onSelectionChange?.({ guardId: null, clientId: null });
    }
  }, [activeItemKey, feedByKey, onSelectionChange]);

  const canReview =
    (canApproveGuardAccounts || canManageGuardAccounts) || canManageClientAccounts;

  const visibleEntries = useMemo(() => {
    return applicationEntries
      .filter((entry) => matchesApplicationKindFilter(entry.kind, kindFilter))
      .filter((entry) =>
        matchesApplicationStatusFilter(entry.item, statusFilter, guards, clients)
      )
      .filter((entry) => applicationFeedItemMatchesSearch(entry.item, search));
  }, [applicationEntries, kindFilter, statusFilter, guards, clients, search]);

  const { showDetailOnly } = useSplitListDetail(activeItemKey, 'page');

  const setSelection = (entry: ApplicationListEntry | null) => {
    const key = entry ? applicationListKey(entry) : null;
    setActiveItemKey(key);
    onSelectionChange?.({
      guardId: entry?.kind === 'guard' ? entry.item.id : null,
      clientId: entry?.kind === 'client' ? entry.item.id : null,
    });
  };

  const renderApplicationDetail = (entry: ApplicationListEntry, options?: { onBack?: () => void }) => {
    const feedItem = entry.item;
    const { kind } = entry;

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
            onOpenGuardProfile={onOpenGuardProfile}
          />
        </div>
      );

      if (options?.onBack) {
        return (
          <div className="-mx-4 sm:-mx-5 app-full-page-detail animate-fade-in">
            <AppSubScreenHeader title={guard.name} onBack={options.onBack} backLabel="Applications" />
            {detailBody}
          </div>
        );
      }

      return (
        <div className="animate-fade-in">
          <div className="app-dashboard-zone-head !px-0 !mb-3">
            <h2 className="app-dashboard-zone-title truncate">{guard.name}</h2>
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
          onOpenClientProfile={onOpenClientProfile}
        />
      </div>
    );

    if (options?.onBack) {
      return (
        <div className="-mx-4 sm:-mx-5 app-full-page-detail animate-fade-in">
          <AppSubScreenHeader
            title={client.companyName || client.name}
            onBack={options.onBack}
            backLabel="Applications"
          />
          {detailBody}
        </div>
      );
    }

    return (
      <div className="animate-fade-in">
        <div className="app-dashboard-zone-head !px-0 !mb-3">
          <h2 className="app-dashboard-zone-title truncate">{client.companyName || client.name}</h2>
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
      <div className="flex flex-row flex-wrap items-center gap-2">
        {canManageGuardAccounts && onAddGuard && (
          <StaffAddGuardForm
            showInlineTriggerOnDesktop
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
            showInlineTriggerOnDesktop
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
          aria-label="Application status"
          activeId={statusFilter}
          onChange={(id) => setStatusFilter(id as ApplicationStatusFilter)}
          tabs={[
            { id: 'pending', label: 'Pending review' },
            { id: 'all', label: 'All' },
          ]}
        />
        <StaffListFilterTabs
          aria-label="Application type"
          activeId={kindFilter}
          onChange={(id) => setKindFilter(id as ApplicationKindFilter)}
          tabs={[
            { id: 'all', label: 'All types' },
            { id: 'guard', label: 'Guards' },
            { id: 'client', label: 'Clients' },
          ]}
        />
      </div>
    </>
  ) : null;

  return (
    <StaffOpsPageShell toolbar={toolbar} className="staff-roster-panel" data-tour="staff-applications">
      {visibleEntries.length === 0 ? (
        <AppEmptyState dashed icon={<UserCheck className="w-5 h-5" />} title="All clear">
          {search.trim()
            ? 'No applications match your search.'
            : statusFilter === 'pending'
              ? 'No account applications waiting for review.'
              : 'No account applications on file yet.'}
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
          autoSelectFirst={false}
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
