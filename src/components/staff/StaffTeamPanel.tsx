import React, { useEffect, useState } from 'react';
import { PlatformRole, SecurityGuard, StaffRole } from '../../types';
import { getAssignableStaffRoles } from '../../lib/permissions';
import { ListDetailLayout, useListDetailState } from '../ui/app/ListDetailLayout';
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

  const assignableRoles = getAssignableStaffRoles(currentUserRole);
  const { showDetailOnly } = useListDetailState(selectedId);

  return (
    <div className="animate-fade-in space-y-4">
      {!showDetailOnly && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <p className="text-sm text-brand-text-muted flex-1">
          Guardr platform staff — operations and administration only, not field jobs.
          {!canManageStaff && ' Directors and Owners manage staff accounts; you have view-only access here.'}
        </p>
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

      {filtered.length === 0 && !showDetailOnly ? (
        <p className="text-sm text-brand-text-muted py-12 text-center border border-dashed border-brand-border rounded-xl">
          {roster.length === 0
            ? 'No staff accounts yet. Directors and Owners can use Add staff above.'
            : 'No staff match your search.'}
        </p>
      ) : (
        <ListDetailLayout
          items={filtered}
          selectedId={selectedId}
          onSelectId={setSelectedId}
          getItemId={(member) => member.id}
          listScrollClassName="max-h-[75vh] overflow-y-auto pr-1"
          renderItem={(member, onSelect) => {
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
              />
            );
          }}
          renderDetail={(member, { onBack }) => (
            <StaffTeamDetailPanel
              member={member}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              canManageStaff={canManageStaff}
              onUpdateUserStatus={onUpdateUserStatus}
              onUpdateStaffRole={onUpdateStaffRole}
              onBack={onBack}
            />
          )}
        />
      )}
    </div>
  );
}
