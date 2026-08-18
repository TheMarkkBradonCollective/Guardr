import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Search } from 'lucide-react';
import { Client, SecurityRequest, SessionUser } from '../../types';
import { clientAccountKindLabel, clientDisplayName } from '../../lib/clientAccountKind';
import { ListDetailLayout, useSplitListDetail } from '../ui/app/ListDetailLayout';
import { StaffClientDetailPanel } from './StaffClientDetailPanel';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
import { StaffAddClientForm } from './StaffAddClientForm';
import type { StaffAddClientInput } from './StaffAddClientForm';
import { CLIENT_ACCOUNT_STATUS_LABELS, clientRosterSortRank, getClientAccountStatus } from '../../lib/accountStatus';
import {
  matchesClientRosterFilter,
  type ClientRosterFilter,
} from '../../lib/staffListFilters';
import { StaffListFilterTabs } from './StaffListFilterTabs';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import { StaffJobApprovalSettings } from './StaffJobApprovalSettings';
import type { PlatformSettings } from '../../lib/platformSettings';
import { canManageStaffPermissions } from '../../lib/permissions';
import type { StaffPermissionsPatch } from './StaffPermissionsPanel';
import { useDevice } from '../../lib/platform';
import { StatusChip, type StatusTone } from '../baseui/StatusChip';
import { GuardrDataTable, type GuardrTableColumn } from '../baseui/GuardrDataTable';
import {
  WorkbenchEmpty,
  WorkbenchPage,
  WorkbenchPanel,
  WorkbenchSplit,
} from '../baseui/layout/WorkbenchLayout';

type ClientsPageTab = 'roster' | 'job-posting';

interface StaffClientsPanelProps {
  currentUser: SessionUser;
  clients: Client[];
  requests: SecurityRequest[];
  canManage: boolean;
  platformSettings: PlatformSettings;
  onUpdateStaffPermissions?: (patch: StaffPermissionsPatch) => void | Promise<void>;
  onApproveClient: (id: string) => void;
  onRejectClient: (id: string) => void;
  onDeleteClient?: (id: string) => void | Promise<void>;
  onSetClientTrusted?: (clientId: string, trusted: boolean) => void | Promise<void>;
  selectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
  initialSelectedId?: string | null;
  onOpenJob?: (jobId: string) => void;
  onAddClient?: (input: StaffAddClientInput) => Promise<string>;
}

function clientStatusTone(status: ReturnType<typeof getClientAccountStatus>): StatusTone {
  switch (status) {
    case 'active':
      return 'positive';
    case 'pending':
      return 'warning';
    case 'suspended':
      return 'negative';
    default:
      return 'neutral';
  }
}

export function StaffClientsPanel({
  currentUser,
  clients,
  requests,
  canManage,
  platformSettings,
  onUpdateStaffPermissions,
  onApproveClient,
  onRejectClient,
  onDeleteClient,
  onSetClientTrusted,
  selectedId: controlledSelectedId,
  onSelectedIdChange,
  initialSelectedId = null,
  onOpenJob,
  onAddClient,
}: StaffClientsPanelProps) {
  const { formFactor } = useDevice();
  const [pageTab, setPageTab] = useState<ClientsPageTab>('roster');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientRosterFilter>('all');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(initialSelectedId);
  const isControlled = controlledSelectedId !== undefined;
  const selectedId = isControlled ? controlledSelectedId : internalSelectedId;
  const canEditApprovalRules = canManageStaffPermissions(currentUser);

  const setSelectedId = (id: string | null) => {
    if (!isControlled) setInternalSelectedId(id);
    onSelectedIdChange?.(id);
  };

  useEffect(() => {
    if (isControlled) return;
    setInternalSelectedId(initialSelectedId);
  }, [initialSelectedId, isControlled]);

  const filtered = clients
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        (c.companyName ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .filter((c) => matchesClientRosterFilter(c, statusFilter))
    .sort((a, b) => {
      const rank = clientRosterSortRank(a) - clientRosterSortRank(b);
      if (rank !== 0) return rank;
      return clientDisplayName(a).localeCompare(clientDisplayName(b));
    });

  const selectedClient = selectedId ? clients.find((c) => c.id === selectedId) ?? null : null;

  useEffect(() => {
    if (formFactor === 'mobile' || pageTab !== 'roster') return;
    if (filtered.length === 0) {
      if (selectedId) setSelectedId(null);
      return;
    }
    const stillVisible = selectedId ? filtered.some((c) => c.id === selectedId) : false;
    if (!stillVisible) setSelectedId(filtered[0].id);
  }, [statusFilter, filtered, selectedId, formFactor, pageTab]);

  const clientColumns: GuardrTableColumn<Client>[] = useMemo(
    () => [
      {
        id: 'client',
        header: 'Client',
        grow: true,
        sortValue: (client) => clientDisplayName(client).toLowerCase(),
        render: (client) => (
          <>
            <p className="uber-workbench-table-primary">{clientDisplayName(client)}</p>
            <p className="uber-workbench-table-secondary">
              {clientAccountKindLabel(client.accountKind)} · {client.email}
            </p>
          </>
        ),
      },
      {
        id: 'jobs',
        header: 'Active jobs',
        numeric: true,
        align: 'right',
        sortValue: (client) =>
          requests.filter(
            (r) => r.clientId === client.id && ['accepted', 'in-progress', 'open'].includes(r.status),
          ).length,
        render: (client) => {
          const activeJobs = requests.filter(
            (r) => r.clientId === client.id && ['accepted', 'in-progress', 'open'].includes(r.status),
          ).length;
          return activeJobs;
        },
      },
      {
        id: 'status',
        header: 'Status',
        sortValue: (client) => getClientAccountStatus(client),
        render: (client) => {
          const status = getClientAccountStatus(client);
          return (
            <StatusChip tone={clientStatusTone(status)}>{CLIENT_ACCOUNT_STATUS_LABELS[status]}</StatusChip>
          );
        },
      },
    ],
    [requests],
  );

  const { showDetailOnly } = useSplitListDetail(selectedId, 'page');

  function renderClientDetail(client: Client, options?: { onBack?: () => void }) {
    return (
      <StaffClientDetailPanel
        client={client}
        requests={requests}
        canManage={canManage}
        onApproveClient={onApproveClient}
        onRejectClient={onRejectClient}
        onDeleteClient={onDeleteClient}
        onSetClientTrusted={onSetClientTrusted}
        onOpenJob={onOpenJob}
        onBack={options?.onBack}
      />
    );
  }

  const toolbar = !showDetailOnly ? (
    <>
      {pageTab === 'roster' && (
        <>
          <div className="staff-ops-cta-stack">
            {canManage && onAddClient && (
              <StaffAddClientForm
                onAdd={onAddClient}
                onCreated={(clientId) => {
                  setSearch('');
                  setSelectedId(clientId);
                }}
              />
            )}
          </div>
          <WfSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search clients..."
            className="max-w-md"
          />
        </>
      )}
      <div className="space-y-2">
        <StaffListFilterTabs
          aria-label="Clients section"
          activeId={pageTab}
          onChange={(id) => setPageTab(id as ClientsPageTab)}
          tabs={[
            { id: 'roster', label: 'Roster' },
            { id: 'job-posting', label: 'Job posting' },
          ]}
        />
        {pageTab === 'roster' && (
          <StaffListFilterTabs
            aria-label="Client roster status"
            activeId={statusFilter}
            onChange={(id) => setStatusFilter(id as ClientRosterFilter)}
            tabs={[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'active', label: 'Active' },
              { id: 'suspended', label: 'Suspended' },
            ]}
          />
        )}
      </div>
    </>
  ) : null;

  if (pageTab === 'job-posting' && !showDetailOnly) {
    return (
      <StaffOpsPageShell toolbar={toolbar} className="staff-roster-panel">
        <StaffJobApprovalSettings
          currentUser={currentUser}
          platformSettings={platformSettings}
          canEdit={canEditApprovalRules}
          onPersistSettings={onUpdateStaffPermissions}
        />
      </StaffOpsPageShell>
    );
  }

  if (formFactor === 'desktop' && pageTab === 'roster') {
    return (
      <WorkbenchPage className="staff-roster-panel">
        {toolbar}
        <WorkbenchPanel padding={false}>
          <WorkbenchSplit
            list={
              filtered.length === 0 ? (
                <WorkbenchEmpty
                  icon={search ? Search : Building2}
                  message={search ? 'No clients match your search' : 'No clients yet'}
                />
              ) : (
                <GuardrDataTable
                  columns={clientColumns}
                  rows={filtered}
                  rowKey={(client) => client.id}
                  selectedKey={selectedId ?? undefined}
                  onRowClick={(client) => setSelectedId(client.id)}
                  caption="Clients"
                  cardLayout={{ title: 'client', subtitle: 'jobs', trailing: 'status' }}
                />
              )
            }
            detail={
              selectedClient ? (
                renderClientDetail(selectedClient)
              ) : (
                <WorkbenchEmpty icon={Building2} message="Select a client to review account details" variant="detail" />
              )
            }
          />
        </WorkbenchPanel>
      </WorkbenchPage>
    );
  }

  return (
    <StaffOpsPageShell toolbar={toolbar} className="staff-roster-panel">
      {filtered.length === 0 ? (
        <div className="app-empty-state app-empty-state--dashed">
          <div className="app-empty-state-icon">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <p className="app-empty-state-title">
            {clients.length === 0 ? 'No clients yet' : 'No clients match your search'}
          </p>
          <p className="app-empty-state-body">
            {clients.length === 0
              ? 'Add the first client account to get started.'
              : 'Try adjusting your search term.'}
          </p>
        </div>
      ) : (
        <ListDetailLayout
          items={filtered}
          selectedId={selectedId}
          onSelectId={setSelectedId}
          getItemId={(client) => client.id}
          listScrollClassName="max-h-[75vh] overflow-y-auto pr-1"
          renderItem={(client, isActive, onSelect) => {
            const accountStatus = getClientAccountStatus(client);
            const activeJobs = requests.filter(
              (r) => r.clientId === client.id && ['accepted', 'in-progress', 'open'].includes(r.status)
            ).length;

            return (
              <WfListCard
                avatar={
                  <ProfileAvatar
                    src={client.avatar}
                    name={clientDisplayName(client)}
                    size="sm"
                    rounded="lg"
                  />
                }
                title={clientDisplayName(client)}
                subtitle={client.email}
                meta={
                  <div className="flex flex-wrap items-center gap-1.5">
                    <WfBadge
                      tone={
                        accountStatus === 'pending'
                          ? 'warning'
                          : accountStatus === 'active'
                            ? 'success'
                            : 'danger'
                      }
                    >
                      {CLIENT_ACCOUNT_STATUS_LABELS[accountStatus]}
                    </WfBadge>
                    <span className="text-[11px] text-brand-text-muted">{activeJobs} active job{activeJobs === 1 ? '' : 's'}</span>
                  </div>
                }
                onClick={onSelect}
                className={isActive ? 'app-item-card-selected' : ''}
              />
            );
          }}
          renderDetail={renderClientDetail}
          mobilePresentation="page"
        />
      )}
    </StaffOpsPageShell>
  );
}
