import React, { useEffect, useState } from 'react';
import { PlatformRole, SecurityGuard, StaffRole } from '../../types';
import { getAssignableStaffRoles } from '../../lib/permissions';
import { ListDetailLayout, useSplitListDetail } from '../ui/app/ListDetailLayout';
import { StaffTeamDetailPanel } from './StaffTeamDetailPanel';
import { StaffAddStaffForm } from './StaffAddStaffForm';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';

interface StaffTeamPanelProps {
  guards: SecurityGuard[];
  currentUserId: string;
  currentUserRole: PlatformRole;
  canManageStaff: boolean;
  onUpdateUserStatus: (id: string, status: 'active' | 'suspended' | 'blocked') => void;
  onAddStaff?: (input: {
    name: string;
    email: string;
    badgeNumber: string;
    staffRole: StaffRole;
  }) => Promise<string>;
  onUpdateStaffRole?: (staffId: string, role: StaffRole) => Promise<void>;
  selectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
  initialSelectedId?: string | null;
}

export function StaffTeamPanel({
  guards,
  currentUserId,
  currentUserRole,
  canManageStaff,
  onUpdateUserStatus,
  onAddStaff,
  onUpdateStaffRole,
  selectedId: controlledSelectedId,
  onSelectedIdChange,
  initialSelectedId = null,
}: StaffTeamPanelProps) {
  const [search, setSearch] = useState('');
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

  const filtered = roster.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase()) ||
      (g.badgeNumber ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const { showDetailOnly } = useSplitListDetail(selectedId, 'page');
  const assignableRoles = getAssignableStaffRoles(currentUserRole);

  return (
    <div className="animate-fade-in space-y-4">
      {!showDetailOnly && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            {canManageStaff && onAddStaff && assignableRoles.length > 0 && (
              <StaffAddStaffForm
                assignableRoles={assignableRoles}
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
        </>
      )}

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
              ? 'Directors and Owners can add staff accounts above.'
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
                avatar={<ProfileAvatar src={member.avatar} name={member.name} size="sm" rounded="lg" />}
                title={member.name}
                subtitle={member.email}
                meta={
                  <div className="flex flex-wrap items-center gap-1.5">
                    <WfBadge tone="primary">{member.staffRole || 'Staff'}</WfBadge>
                    <span>{accountStatus}</span>
                    {member.badgeNumber && <span>Badge {member.badgeNumber}</span>}
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
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              canManageStaff={canManageStaff}
              onUpdateUserStatus={onUpdateUserStatus}
              onUpdateStaffRole={onUpdateStaffRole}
              onBack={options?.onBack}
            />
          )}
          mobilePresentation="page"
        />
      )}
    </div>
  );
}
