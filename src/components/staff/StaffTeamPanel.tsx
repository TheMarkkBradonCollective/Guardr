import React, { useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { useDevice } from '../../lib/platform';
import { StaffGuardDetailPanel } from './StaffGuardDetailPanel';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
interface StaffTeamPanelProps {
  guards: SecurityGuard[];
  requests: SecurityRequest[];
  canSuspend: boolean;
  onUpdateUserStatus: (id: string, status: 'active' | 'suspended' | 'blocked') => void;
  initialSelectedId?: string | null;
}

export function StaffTeamPanel({
  guards,
  requests,
  canSuspend,
  onUpdateUserStatus,
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

  const detailProps = selected
    ? {
        guard: selected,
        requests,
        canSuspend,
        onUpdateUserStatus,
        onApproveCert: () => {},
        onRejectCert: () => {},
      }
    : null;

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

  return (
    <div className="animate-fade-in space-y-4">
      {!showDetailOnly && (
        <>
          <p className="text-sm text-brand-text-muted">
            Guardr platform staff — operations and administration only, not field security shifts.
          </p>
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
          No staff accounts on file.
        </p>
      ) : showDetailOnly && detailProps ? (
        <StaffGuardDetailPanel {...detailProps} onBack={() => setSelectedId(null)} />
      ) : splitView ? (
        <div className="tablet-split-panel">
          <div className="max-h-[75vh] overflow-y-auto pr-1">
            <AppItemCardStack>
              {filtered.map((member) => renderTeamCard(member, selected?.id === member.id))}
            </AppItemCardStack>
          </div>
          {detailProps && <StaffGuardDetailPanel {...detailProps} />}
        </div>
      ) : (
        <AppItemCardStack>
          {filtered.map((member) => renderTeamCard(member, false))}
        </AppItemCardStack>
      )}
    </div>
  );
}
