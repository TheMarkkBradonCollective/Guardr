import React, { useState } from 'react';
import { PlatformRole, SecurityGuard, StaffRole } from '../../types';
import { getAssignableStaffRoles } from '../../lib/permissions';
import { useDevice } from '../../lib/platform';
import { StaffTeamDetailPanel } from './StaffTeamDetailPanel';
import { StaffAddStaffForm } from './StaffAddStaffForm';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
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
  initialSelectedId = null,
}: StaffTeamPanelProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const { formFactor } = useDevice();
  const splitView = formFactor === 'tablet' || formFactor === 'desktop';

  const roster = guards.filter((g) => g.isStaff);

  const filtered = roster.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase()) ||
      (g.badgeNumber ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const selected = filtered.find((g) => g.id === selectedId) ?? (splitView ? filtered[0] : null) ?? null;
  const showDetailOnly = Boolean(selected && !splitView);

  function renderTeamCard(member: SecurityGuard, isActive: boolean) {
    const accountStatus = member.userStatus || 'active';

    return (
      <WfListCard
        key={member.id}
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
        onClick={() => setSelectedId(member.id)}
        className={isActive ? 'app-item-card-selected' : ''}
      />
    );
  }

  const assignableRoles = getAssignableStaffRoles(currentUserRole);

  const detailPanel = selected ? (
    <StaffTeamDetailPanel
      member={selected}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
      canManageStaff={canManageStaff}
      onUpdateUserStatus={onUpdateUserStatus}
      onUpdateStaffRole={onUpdateStaffRole}
      onBack={showDetailOnly ? () => setSelectedId(null) : undefined}
    />
  ) : null;

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

      {filtered.length === 0 ? (
        <p className="text-sm text-brand-text-muted py-12 text-center border border-dashed border-brand-border rounded-xl">
          {roster.length === 0
            ? 'No staff accounts yet. Directors and Owners can use Add staff above.'
            : 'No staff match your search.'}
        </p>
      ) : showDetailOnly && detailPanel ? (
        detailPanel
      ) : splitView ? (
        <div className="tablet-split-panel">
          <div className="max-h-[75vh] overflow-y-auto pr-1">
            <AppItemCardStack>
              {filtered.map((member) => renderTeamCard(member, selected?.id === member.id))}
            </AppItemCardStack>
          </div>
          {detailPanel}
        </div>
      ) : (
        <AppItemCardStack>
          {filtered.map((member) => renderTeamCard(member, false))}
        </AppItemCardStack>
      )}
    </div>
  );
}
