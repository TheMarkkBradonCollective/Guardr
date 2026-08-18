import React, { useEffect, useState } from 'react';
import { PlatformRole, SecurityGuard, StaffRole, StaffSideRole } from '../../types';
import { getAssignableStaffRoles, MANAGEMENT_STAFF_ROLES, ROLE_LABELS, STAFF_OPERATIONS_ROLES, staffRoleToPlatformRole } from '../../lib/permissions';
import type { PlatformCity } from '../../lib/platformCities';
import type { PlatformSettings } from '../../lib/platformSettings';
import type { StaffTeamDetailTab } from '../../lib/appNavigation';
import {
  matchesStaffRoleFilter,
  matchesStaffTierFilter,
  staffRosterSortRank,
  type StaffRoleFilter,
  type StaffRosterTier,
} from '../../lib/staffListFilters';
import { ListDetailLayout, useSplitListDetail } from '../ui/app/ListDetailLayout';
import { StaffTeamDetailPanel } from './StaffTeamDetailPanel';
import { StaffAddStaffForm } from './StaffAddStaffForm';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
import type { ProfileSavePayload } from '../profile/UserProfileScreen';
import { getStaffDisplayName } from '../../lib/staffProfile';
import { getStaffRosterStatusLabel } from '../../lib/staffAccountActivation';
import { getGuardUserStatus } from '../../lib/accountStatus';
import { useLayoutFormFactor } from '../../surfaces';
import { StatusChip, type StatusTone } from '../baseui/StatusChip';
import { GuardrDataTable, type GuardrTableColumn } from '../baseui/GuardrDataTable';
import {
  WorkbenchEmpty,
  WorkbenchSplit,
} from '../baseui/layout/WorkbenchLayout';
import { Users } from 'lucide-react';

import { StaffListFilterTabs } from './StaffListFilterTabs';
import { StaffOpsPageShell } from './StaffOpsPageShell';

function staffRosterStatusTone(member: SecurityGuard): StatusTone {
  const status = getGuardUserStatus(member);
  const label = getStaffRosterStatusLabel(member);
  if (status === 'suspended' || status === 'blocked') return 'negative';
  if (status === 'pending') return 'warning';
  if (label === 'Active') return 'positive';
  if (label === 'Inactive') return 'warning';
  return 'neutral';
}

interface StaffTeamPanelProps {
  tier: StaffRosterTier;
  guards: SecurityGuard[];
  platformCities?: PlatformCity[];
  currentUserId: string;
  currentUserRole: PlatformRole;
  actorManagedCities?: string[];
  canManageStaff: boolean;
  canProposeStaff: boolean;
  canApproveStaffAccounts?: boolean;
  requiresDirectorApproval?: boolean;
  onUpdateUserStatus: (id: string, status: 'active' | 'suspended' | 'blocked') => void;
  onAddStaff?: (input: {
    email: string;
    personalEmail?: string;
    badgeNumber: string;
    staffRole: StaffRole | null;
    sideRole?: StaffSideRole | null;
    firstName: string;
    middleName?: string;
    lastName: string;
    managedCities?: string[];
    assignedManagerIds?: string[];
  }) => Promise<string>;
  onApproveStaffAccount?: (staffId: string) => void | Promise<void>;
  onRejectStaffAccount?: (staffId: string) => void | Promise<void>;
  onUpdateStaffRole?: (
    staffId: string,
    role: StaffRole | null,
    options?: { sideRole?: StaffSideRole | null }
  ) => Promise<{ badgeNumber: string } | void>;
  onUpdateStaffCityAccess?: (
    staffId: string,
    patch: { managedCities?: string[]; assignedManagerIds?: string[] }
  ) => Promise<void>;
  onUpdateStaffProfile?: (staffId: string, payload: ProfileSavePayload) => void | Promise<void>;
  platformSettings?: PlatformSettings;
  selectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
  initialSelectedId?: string | null;
}

export function StaffTeamPanel({
  tier,
  guards,
  platformCities = [],
  currentUserId,
  currentUserRole,
  actorManagedCities = [],
  canManageStaff,
  canProposeStaff,
  canApproveStaffAccounts = false,
  requiresDirectorApproval = false,
  onUpdateUserStatus,
  onAddStaff,
  onApproveStaffAccount,
  onRejectStaffAccount,
  onUpdateStaffRole,
  onUpdateStaffCityAccess,
  onUpdateStaffProfile,
  platformSettings,
  selectedId: controlledSelectedId,
  onSelectedIdChange,
  initialSelectedId = null,
}: StaffTeamPanelProps) {
  const formFactor = useLayoutFormFactor();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRoleFilter>('all');
  const [staffTeamTab, setStaffTeamTab] = useState<StaffTeamDetailTab>('profile');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(initialSelectedId);
  const isControlled = controlledSelectedId !== undefined;
  const selectedId = isControlled ? controlledSelectedId : internalSelectedId;
  const tierRoleOptions = tier === 'management' ? MANAGEMENT_STAFF_ROLES : STAFF_OPERATIONS_ROLES;
  const rosterLabel = tier === 'management' ? 'Management' : 'Staff';
  const searchPlaceholder = tier === 'management' ? 'Search management...' : 'Search staff...';

  const setSelectedId = (id: string | null) => {
    if (!isControlled) setInternalSelectedId(id);
    onSelectedIdChange?.(id);
    if (id) setStaffTeamTab('profile');
  };

  useEffect(() => {
    if (isControlled) return;
    setInternalSelectedId(initialSelectedId);
  }, [initialSelectedId, isControlled]);
  const roster = guards.filter((g) => g.isStaff).filter((member) => matchesStaffTierFilter(member, tier));

  const filtered = roster
    .filter(
      (g) =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.email.toLowerCase().includes(search.toLowerCase()) ||
        (g.personalEmail ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (g.badgeNumber ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .filter((member) => matchesStaffRoleFilter(member, roleFilter))
    .sort((a, b) => {
      const rank = staffRosterSortRank(a) - staffRosterSortRank(b);
      if (rank !== 0) return rank;
      return a.name.localeCompare(b.name);
    });

  const selectedMember = selectedId ? filtered.find((member) => member.id === selectedId) ?? null : null;

  const teamColumns: GuardrTableColumn<SecurityGuard>[] = [
    {
      id: 'staff',
      header: 'Staff',
      grow: true,
      sortValue: (member) => getStaffDisplayName(member).toLowerCase(),
      render: (member) => (
        <>
          <p className="uber-workbench-table-primary">{getStaffDisplayName(member)}</p>
          <p className="uber-workbench-table-secondary">{member.email}</p>
        </>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      sortValue: (member) => member.staffRole ?? member.sideRole ?? '',
      render: (member) =>
        member.staffRole
          ? member.sideRole === 'Finance'
            ? `${member.staffRole} · Finance`
            : member.staffRole
          : member.sideRole === 'Finance'
            ? 'Finance desk'
            : 'Staff',
    },
    {
      id: 'badge',
      header: 'Badge',
      hideOnNarrow: true,
      sortValue: (member) => member.badgeNumber ?? '',
      render: (member) => member.badgeNumber || '—',
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (member) => getStaffRosterStatusLabel(member),
      render: (member) => (
        <StatusChip tone={staffRosterStatusTone(member)}>{getStaffRosterStatusLabel(member)}</StatusChip>
      ),
    },
  ];

  const { showDetailOnly } = useSplitListDetail(selectedId, 'page');
  const assignableRoles = getAssignableStaffRoles(currentUserRole);

  const toolbar = !showDetailOnly ? (
    <>
      <div className="staff-ops-cta-stack">
        {tier === 'operations' && canProposeStaff && onAddStaff && assignableRoles.length > 0 && (
          <StaffAddStaffForm
            assignableRoles={assignableRoles}
            requiresDirectorApproval={requiresDirectorApproval}
            actorRole={currentUserRole}
            platformCities={platformCities}
            actorManagedCities={actorManagedCities}
            managerOptions={guards.filter((g) => g.isStaff && g.staffRole === 'Manager')}
            roster={guards.filter((g) => g.isStaff)}
            onAdd={onAddStaff}
            onCreated={(staffId) => {
              setSearch('');
              setSelectedId(staffId);
            }}
          />
        )}
      </div>
      <WfSearchBar
        value={search}
        onChange={setSearch}
        placeholder={searchPlaceholder}
        className="max-w-md"
      />
      <StaffListFilterTabs
        aria-label={`${rosterLabel} role`}
        activeId={roleFilter}
        onChange={(id) => setRoleFilter(id as StaffRoleFilter)}
        tabs={[
          { id: 'all', label: 'All' },
          ...tierRoleOptions.map((role) => ({
            id: role,
            label: ROLE_LABELS[staffRoleToPlatformRole(role)],
          })),
        ]}
      />
    </>
  ) : null;

  const detailPanel = selectedMember ? (
    <StaffTeamDetailPanel
      member={selectedMember}
      roster={filtered}
      platformCities={platformCities}
      managerOptions={guards.filter((g) => g.isStaff && g.staffRole === 'Manager')}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
      actorManagedCities={actorManagedCities}
      canManageStaff={canManageStaff}
      canApproveStaffAccounts={canApproveStaffAccounts}
      onUpdateUserStatus={onUpdateUserStatus}
      onApproveStaffAccount={onApproveStaffAccount}
      onRejectStaffAccount={onRejectStaffAccount}
      onUpdateStaffRole={onUpdateStaffRole}
      onUpdateStaffCityAccess={onUpdateStaffCityAccess}
      onUpdateStaffProfile={onUpdateStaffProfile}
      platformSettings={platformSettings}
      staffTeamTab={staffTeamTab}
      onStaffTeamTabChange={setStaffTeamTab}
    />
  ) : null;

  if (formFactor === 'desktop') {
    return (
      <StaffOpsPageShell toolbar={toolbar} className="staff-roster-panel">
        <WorkbenchSplit
          list={
            filtered.length === 0 ? (
              <WorkbenchEmpty
                icon={Users}
                message={roster.length === 0 ? `No ${rosterLabel.toLowerCase()} accounts yet` : `No ${rosterLabel.toLowerCase()} match your search`}
              />
            ) : (
              <GuardrDataTable
                columns={teamColumns}
                rows={filtered}
                rowKey={(member) => member.id}
                selectedKey={selectedId ?? undefined}
                onRowClick={(member) => setSelectedId(member.id)}
                caption={rosterLabel}
                cardLayout={{ title: 'staff', subtitle: 'role', trailing: 'status' }}
              />
            )
          }
          detail={
            detailPanel ?? (
              <WorkbenchEmpty icon={Users} message="Select a staff member to review profile and access" variant="detail" />
            )
          }
        />
      </StaffOpsPageShell>
    );
  }

  return (
    <StaffOpsPageShell toolbar={toolbar} className="staff-roster-panel">
      {filtered.length === 0 ? (
        <div className="app-empty-state app-empty-state--dashed">
          <div className="app-empty-state-icon">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <p className="app-empty-state-title">
            {roster.length === 0 ? `No ${rosterLabel.toLowerCase()} accounts yet` : `No ${rosterLabel.toLowerCase()} match your search`}
          </p>
          <p className="app-empty-state-body">
            {roster.length === 0
              ? tier === 'management'
                ? 'Manager, Director, and Founder accounts appear here.'
                : 'Administrators can submit staff for approval. Directors and Founders can add staff directly.'
              : 'Try adjusting your search.'}
          </p>
        </div>
      ) : (
        <ListDetailLayout
          items={filtered}
          selectedId={selectedId}
          onSelectId={setSelectedId}
          getItemId={(member) => member.id}
          listScrollClassName="max-h-[75vh] overflow-y-auto pr-1"
          renderItem={(member, isActive, onSelect) => {
            const accountStatusLabel = getStaffRosterStatusLabel(member);
            const displayName = getStaffDisplayName(member);

            return (
              <WfListCard
                avatar={<ProfileAvatar src={member.avatar} name={displayName} size="sm" rounded="lg" />}
                title={displayName}
                subtitle={member.email}
                meta={
                  <div className="flex flex-wrap items-center gap-1.5">
                    <WfBadge tone="primary">
                      {member.staffRole
                        ? member.sideRole === 'Finance'
                          ? `${member.staffRole} · Finance`
                          : member.staffRole
                        : member.sideRole === 'Finance'
                          ? 'Finance desk'
                          : 'Staff'}
                    </WfBadge>
                    <span className="text-xs text-brand-text-muted">{member.badgeNumber}</span>
                    <span>{accountStatusLabel}</span>
                  </div>
                }
                onClick={onSelect}
                className={isActive ? 'app-item-card-selected' : ''}
              />
            );
          }}
          renderDetail={(member, options) => (
            <StaffTeamDetailPanel
              member={member}
              roster={filtered}
              platformCities={platformCities}
              managerOptions={guards.filter((g) => g.isStaff && g.staffRole === 'Manager')}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              actorManagedCities={actorManagedCities}
              canManageStaff={canManageStaff}
              canApproveStaffAccounts={canApproveStaffAccounts}
              onUpdateUserStatus={onUpdateUserStatus}
              onApproveStaffAccount={onApproveStaffAccount}
              onRejectStaffAccount={onRejectStaffAccount}
              onUpdateStaffRole={onUpdateStaffRole}
              onUpdateStaffCityAccess={onUpdateStaffCityAccess}
              onUpdateStaffProfile={onUpdateStaffProfile}
              platformSettings={platformSettings}
              staffTeamTab={staffTeamTab}
              onStaffTeamTabChange={setStaffTeamTab}
              onBack={options?.onBack}
            />
          )}
          mobilePresentation="page"
        />
      )}
    </StaffOpsPageShell>
  );
}
