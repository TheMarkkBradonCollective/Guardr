import React, { useEffect, useState } from 'react';
import { PlatformRole, SecurityGuard, StaffRole } from '../../types';
import { getAssignableStaffRoles } from '../../lib/permissions';
import type { PlatformCity } from '../../lib/platformCities';
import {
  matchesStaffTeamFilter,
  staffRosterSortRank,
  type StaffTeamFilter,
} from '../../lib/staffListFilters';
import { ListDetailLayout, useSplitListDetail } from '../ui/app/ListDetailLayout';
import { StaffTeamDetailPanel } from './StaffTeamDetailPanel';
import { StaffAddStaffForm } from './StaffAddStaffForm';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
import { getStaffDisplayName } from '../../lib/staffProfile';

import { StaffListFilterTabs } from './StaffListFilterTabs';
import { StaffOpsPageShell } from './StaffOpsPageShell';

interface StaffTeamPanelProps {
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
    staffRole: StaffRole;
    firstName: string;
    middleName?: string;
    lastName: string;
    managedCities?: string[];
    assignedManagerIds?: string[];
  }) => Promise<string>;
  onApproveStaffAccount?: (staffId: string) => void | Promise<void>;
  onRejectStaffAccount?: (staffId: string) => void | Promise<void>;
  onUpdateStaffRole?: (staffId: string, role: StaffRole) => Promise<{ badgeNumber: string } | void>;
  onUpdateStaffCityAccess?: (
    staffId: string,
    patch: { managedCities?: string[]; assignedManagerIds?: string[] }
  ) => Promise<void>;
  selectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
  initialSelectedId?: string | null;
}

export function StaffTeamPanel({
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
  selectedId: controlledSelectedId,
  onSelectedIdChange,
  initialSelectedId = null,
}: StaffTeamPanelProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StaffTeamFilter>('pending');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(initialSelectedId);
  const isControlled = controlledSelectedId !== undefined;
  const selectedId = isControlled ? controlledSelectedId : internalSelectedId;

  const setSelectedId = (id: string | null) => {
    if (!isControlled) setInternalSelectedId(id);
    onSelectedIdChange?.(id);
  };

  useEffect(() => {
    if (isControlled) return;
    setInternalSelectedId(initialSelectedId);
  }, [initialSelectedId, isControlled]);
  const roster = guards.filter((g) => g.isStaff);

  const filtered = roster
    .filter(
      (g) =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.email.toLowerCase().includes(search.toLowerCase()) ||
        (g.personalEmail ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (g.badgeNumber ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .filter((member) => matchesStaffTeamFilter(member, statusFilter))
    .sort((a, b) => {
      const rank = staffRosterSortRank(a) - staffRosterSortRank(b);
      if (rank !== 0) return rank;
      return a.name.localeCompare(b.name);
    });

  const { showDetailOnly } = useSplitListDetail(selectedId, 'page');
  const assignableRoles = getAssignableStaffRoles(currentUserRole);

  const toolbar = !showDetailOnly ? (
    <>
      <div className="staff-ops-cta-stack">
        {canProposeStaff && onAddStaff && assignableRoles.length > 0 && (
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
        placeholder="Search staff..."
        className="max-w-md"
      />
      <StaffListFilterTabs
        aria-label="Staff roster status"
        activeId={statusFilter}
        onChange={(id) => setStatusFilter(id as StaffTeamFilter)}
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'pending', label: 'Pending' },
          { id: 'active', label: 'Active' },
          { id: 'suspended', label: 'Suspended' },
        ]}
      />
    </>
  ) : null;

  return (
    <StaffOpsPageShell toolbar={toolbar} className="staff-roster-panel">
      {filtered.length === 0 ? (
        <div className="app-empty-state app-empty-state--dashed">
          <div className="app-empty-state-icon">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <p className="app-empty-state-title">
            {roster.length === 0 ? 'No staff accounts yet' : 'No staff match your search'}
          </p>
          <p className="app-empty-state-body">
            {roster.length === 0
              ? 'Administrators can submit staff for approval. Directors and Founders can add staff directly.'
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
            const accountStatus = member.userStatus || 'active';
            const displayName = getStaffDisplayName(member);

            return (
              <WfListCard
                avatar={<ProfileAvatar src={member.avatar} name={displayName} size="sm" rounded="lg" />}
                title={displayName}
                subtitle={member.email}
                meta={
                  <div className="flex flex-wrap items-center gap-1.5">
                    <WfBadge tone="primary">{member.staffRole || 'Staff'}</WfBadge>
                    <span className="text-xs text-brand-text-muted">{member.badgeNumber}</span>
                    <span className="capitalize">{accountStatus}</span>
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
              onBack={options?.onBack}
            />
          )}
          mobilePresentation="page"
        />
      )}
    </StaffOpsPageShell>
  );
}
