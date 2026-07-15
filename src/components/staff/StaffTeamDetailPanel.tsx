import React, { useEffect, useState } from 'react';
import { PlatformRole, SecurityGuard, StaffRole } from '../../types';
import {
  confirmBlockAccount,
  confirmRestoreAccount,
  confirmStaffRoleChange,
  confirmSuspendAccount,
} from '../../lib/importantActionConfirm';
import {
  ROLE_DESCRIPTIONS,
  staffRoleToPlatformRole,
  ROLE_LABELS,
  getAssignableStaffRoles,
  canModerateStaffMember,
  platformStaffRank,
  staffRoleRank,
} from '../../lib/permissions';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge } from '../ui/wireframe';
import { ArrowLeft } from 'lucide-react';

interface StaffTeamDetailPanelProps {
  member: SecurityGuard;
  currentUserId: string;
  currentUserRole: PlatformRole;
  canManageStaff: boolean;
  onUpdateUserStatus: (id: string, status: 'active' | 'suspended' | 'blocked') => void;
  onUpdateStaffRole?: (staffId: string, role: StaffRole) => Promise<void>;
  onBack?: () => void;
}

function staffModerationBlockedReason(
  currentUserRole: PlatformRole,
  currentUserId: string,
  member: SecurityGuard
): string {
  if (member.id === currentUserId) {
    return 'You cannot change your own role or account status.';
  }
  const memberRole = member.staffRole ? staffRoleToPlatformRole(member.staffRole) : null;
  if (memberRole === currentUserRole) {
    return 'Staff cannot moderate accounts at the same role level.';
  }
  const actorRank = platformStaffRank(currentUserRole);
  const memberRank = member.staffRole ? staffRoleRank(member.staffRole) : null;
  if (actorRank !== null && memberRank !== null && memberRank > actorRank) {
    return 'You cannot moderate staff above your role.';
  }
  return 'Only staff above this role tier can manage this account.';
}

export function StaffTeamDetailPanel({
  member,
  currentUserId,
  currentUserRole,
  canManageStaff,
  onUpdateUserStatus,
  onUpdateStaffRole,
  onBack,
}: StaffTeamDetailPanelProps) {
  const accountStatus = member.userStatus || 'active';
  const [role, setRole] = useState<StaffRole>(member.staffRole || 'Moderator');
  const [roleMsg, setRoleMsg] = useState('');
  const [roleError, setRoleError] = useState('');
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    setRole(member.staffRole || 'Moderator');
    setRoleMsg('');
    setRoleError('');
  }, [member.id, member.staffRole]);

  const platformRole = staffRoleToPlatformRole(role);
  const assignableRoles = getAssignableStaffRoles(currentUserRole);
  const canModifyMember =
    canManageStaff && canModerateStaffMember(currentUserRole, currentUserId, member);
  const blockedReason = staffModerationBlockedReason(currentUserRole, currentUserId, member);

  const handleRoleSave = async () => {
    if (!onUpdateStaffRole || role === member.staffRole) return;
    if (!(await confirmStaffRoleChange(member.name, role))) return;
    setRoleError('');
    setRoleMsg('');
    setSavingRole(true);
    try {
      await onUpdateStaffRole(member.id, role);
      setRoleMsg(`Role updated to ${role}.`);
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : 'Could not update role.');
    } finally {
      setSavingRole(false);
    }
  };

  const handleUpdateUserStatus = async (status: 'active' | 'suspended' | 'blocked') => {
    const confirmed =
      status === 'suspended'
        ? await confirmSuspendAccount(member.name, 'staff')
        : status === 'blocked'
        ? await confirmBlockAccount(member.name, 'staff')
        : await confirmRestoreAccount(member.name, 'staff');
    if (!confirmed) return;
    onUpdateUserStatus(member.id, status);
  };

  return (
    <div className="staff-detail-pane h-full overflow-y-auto space-y-0">
      {onBack && (
        <div className="px-1 pb-4">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-brand-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to staff list
          </button>
        </div>
      )}

      <div className="flex items-start gap-4 pb-5 border-b border-brand-border">
        <ProfileAvatar src={member.avatar} name={member.name} size="lg" rounded="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold text-lg">{member.badgeNumber || member.name}</h2>
            {member.id === currentUserId && <WfBadge tone="primary">You</WfBadge>}
            <WfBadge tone="primary">{member.staffRole || 'Staff'}</WfBadge>
          </div>
          <p className="text-sm text-brand-text-muted mt-1">{member.email}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-3">
            <div>
              <p className="wf-metric-label">Staff ID</p>
              <p className="wf-metric-value">{member.badgeNumber}</p>
            </div>
            <div>
              <p className="wf-metric-label">Account</p>
              <p className="wf-metric-value capitalize">{accountStatus}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="staff-detail-section space-y-3">
        <h3 className="text-sm font-semibold">Platform role</h3>
        <p className="text-xs text-brand-text-muted leading-relaxed">
          {ROLE_DESCRIPTIONS[platformRole]}
        </p>
        {canModifyMember && onUpdateStaffRole ? (
          <div className="space-y-2 max-w-sm">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="uber-select w-full"
            >
              {assignableRoles.map((staffRole) => (
                <option key={staffRole} value={staffRole}>
                  {staffRole} — {ROLE_LABELS[staffRoleToPlatformRole(staffRole)]}
                </option>
              ))}
            </select>
            {role !== member.staffRole && (
              <button
                type="button"
                onClick={handleRoleSave}
                disabled={savingRole}
                className="app-button-primary app-btn-sm"
              >
                {savingRole ? 'Saving…' : `Save as ${role}`}
              </button>
            )}
            {roleError && <p className="text-sm text-red-400">{roleError}</p>}
            {roleMsg && <p className="text-sm text-brand-primary">{roleMsg}</p>}
          </div>
        ) : (
          <p className="text-sm text-brand-text-muted">{blockedReason}</p>
        )}
      </section>

      {canModifyMember ? (
        <section className="staff-detail-section space-y-2">
          <h3 className="text-sm font-semibold">Account controls</h3>
          <div className="app-action-row--equal">
            {accountStatus !== 'suspended' && (
              <button
                type="button"
                onClick={() => void handleUpdateUserStatus('suspended')}
                className="app-button-outline app-btn-sm"
              >
                Suspend
              </button>
            )}
            {accountStatus !== 'blocked' && (
              <button
                type="button"
                onClick={() => void handleUpdateUserStatus('blocked')}
                className="app-button-outline app-btn-sm text-red-400 border-red-500/40"
              >
                Block
              </button>
            )}
            {accountStatus !== 'active' && (
              <button
                type="button"
                onClick={() => void handleUpdateUserStatus('active')}
                className="app-button-primary app-btn-sm"
              >
                Restore account
              </button>
            )}
          </div>
        </section>
      ) : (
        canManageStaff && (
          <section className="staff-detail-section space-y-2">
            <h3 className="text-sm font-semibold">Account controls</h3>
            <p className="text-xs text-brand-text-muted">{blockedReason}</p>
          </section>
        )
      )}

      {member.bio && (
        <section className="staff-detail-section">
          <h3 className="text-sm font-semibold mb-2">Notes</h3>
          <p className="text-sm text-brand-text-muted leading-relaxed">{member.bio}</p>
        </section>
      )}
    </div>
  );
}
