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
  requiresDirectorApproval?: boolean;
  onUpdateUserStatus: (id: string, status: 'active' | 'suspended' | 'blocked') => void;
  onAddStaff?: (input: {
    email: string;
    badgeNumber: string;
    staffRole: StaffRole;
    managedCities?: string[];
    assignedManagerIds?: string[];
  }) => Promise<string>;
  onUpdateStaffRole?: (staffId: string, role: StaffRole) => Promise<void>;
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
  requiresDirectorApproval = false,
  onUpdateUserStatus,
  onAddStaff,
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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        {canProposeStaff && onAddStaff && assignableRoles.length > 0 && (
          <StaffAddStaffForm
            assignableRoles={assignableRoles}
            requiresDirectorApproval={requiresDirectorApproval}
            actorRole={currentUserRole}
            platformCities={platformCities}
            actorManagedCities={actorManagedCities}
            managerOptions={guards.filter((g) => g.isStaff && g.staffRole === 'Manager')}
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
          { id: 'pending', label: 'Pending review' },
          { id: 'active', label: 'Active' },
          { id: 'suspended', label: 'Suspended' },
          { id: 'all', label: 'All' },
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

            return (
              <WfListCard
                avatar={<ProfileAvatar src={member.avatar} name={member.badgeNumber || member.name} size="sm" rounded="lg" />}
                title={member.badgeNumber || member.name}
                subtitle={`${member.staffRole || 'Staff'} · ${member.email}`}
                meta={
                  <div className="flex flex-wrap items-center gap-1.5">
                    <WfBadge tone="primary">{member.staffRole || 'Staff'}</WfBadge>
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
              platformCities={platformCities}
              managerOptions={guards.filter((g) => g.isStaff && g.staffRole === 'Manager')}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              actorManagedCities={actorManagedCities}
              canManageStaff={canManageStaff}
              onUpdateUserStatus={onUpdateUserStatus}
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
