import React, { useEffect, useState } from 'react';
import { Client, SecurityRequest, SessionUser } from '../../types';
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
import { AppSegmentedControl } from '../ui/app/AppPrimitives';
import type { PlatformSettings } from '../../lib/platformSettings';
import { canManageStaffPermissions } from '../../lib/permissions';
import type { StaffPermissionsPatch } from './StaffPermissionsPanel';

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
  const [pageTab, setPageTab] = useState<ClientsPageTab>('roster');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientRosterFilter>('pending');
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
      return (a.companyName || a.name).localeCompare(b.companyName || b.name);
    });

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

  const pageTabs = !showDetailOnly ? (
    <div className="staff-stats-tabbar">
      <AppSegmentedControl<ClientsPageTab>
        value={pageTab}
        onChange={setPageTab}
        options={[
          { id: 'roster', label: 'Roster' },
          { id: 'job-posting', label: 'Job posting' },
        ]}
      />
    </div>
  ) : null;

  const rosterToolbar =
    !showDetailOnly && pageTab === 'roster' ? (
      <>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
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
      </>
    ) : null;

  const toolbar =
    pageTabs || rosterToolbar ? (
      <>
        {pageTabs}
        {rosterToolbar}
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
                    name={client.companyName || client.name}
                    size="sm"
                    rounded="lg"
                  />
                }
                title={client.companyName || client.name}
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
