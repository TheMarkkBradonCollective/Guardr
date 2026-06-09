import React, { useEffect, useState } from 'react';
import { SecurityGuard, StaffRole } from '../../types';
import { ROLE_DESCRIPTIONS, staffRoleToPlatformRole, ROLE_LABELS } from '../../lib/permissions';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge } from '../ui/wireframe';
import { ArrowLeft } from 'lucide-react';

interface StaffTeamDetailPanelProps {
  member: SecurityGuard;
  currentUserId: string;
  canManageStaff: boolean;
  onUpdateUserStatus: (id: string, status: 'active' | 'suspended' | 'blocked') => void;
  onUpdateStaffRole?: (staffId: string, role: StaffRole) => Promise<void>;
  onBack?: () => void;
}

export function StaffTeamDetailPanel({
  member,
  currentUserId,
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

  const isSelf = member.id === currentUserId;
  const platformRole = staffRoleToPlatformRole(role);

  const handleRoleSave = async () => {
    if (!onUpdateStaffRole || role === member.staffRole) return;
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
            <h2 className="font-bold text-lg">{member.name}</h2>
            {isSelf && <WfBadge tone="primary">You</WfBadge>}
            <WfBadge tone="primary">{member.staffRole || 'Staff'}</WfBadge>
          </div>
          <p className="text-sm text-brand-text-muted mt-1">{member.email}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-3">
            <div>
              <p className="wf-metric-label">Badge</p>
              <p className="wf-metric-value">{member.badgeNumber}</p>
            </div>
            <div>
              <p className="wf-metric-label">Account</p>
              <p className="wf-metric-value capitalize">{accountStatus}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="py-4 border-b border-brand-border space-y-3">
        <h3 className="text-sm font-semibold">Platform role</h3>
        <p className="text-xs text-brand-text-muted leading-relaxed">
          {ROLE_DESCRIPTIONS[platformRole]}
        </p>
        {canManageStaff && onUpdateStaffRole ? (
          <div className="space-y-2 max-w-sm">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              disabled={isSelf}
              className="uber-select w-full"
            >
              <option value="Moderator">Moderator — {ROLE_LABELS.moderator}</option>
              <option value="Administrator">Administrator — {ROLE_LABELS.administrator}</option>
              <option value="Director">Director — {ROLE_LABELS.director}</option>
            </select>
            {isSelf && (
              <p className="text-xs text-brand-text-muted">You cannot change your own role.</p>
            )}
            {!isSelf && role !== member.staffRole && (
              <button
                type="button"
                onClick={handleRoleSave}
                disabled={savingRole}
                className="app-button-primary !w-auto !h-9 !px-4 !text-xs"
              >
                {savingRole ? 'Saving…' : `Save as ${role}`}
              </button>
            )}
            {roleError && <p className="text-sm text-red-400">{roleError}</p>}
            {roleMsg && <p className="text-sm text-brand-primary">{roleMsg}</p>}
          </div>
        ) : (
          <p className="text-sm text-brand-text-muted">
            {member.staffRole || 'Staff'} — only directors can change staff roles.
          </p>
        )}
      </section>

      {canManageStaff && (
        <section className="py-4 border-b border-brand-border space-y-2">
          <h3 className="text-sm font-semibold">Account controls</h3>
          <div className="flex flex-wrap gap-2">
            {!isSelf && accountStatus !== 'suspended' && (
              <button
                type="button"
                onClick={() => onUpdateUserStatus(member.id, 'suspended')}
                className="app-button-outline !w-auto !h-9 !px-4 !text-xs"
              >
                Suspend
              </button>
            )}
            {!isSelf && accountStatus !== 'blocked' && (
              <button
                type="button"
                onClick={() => onUpdateUserStatus(member.id, 'blocked')}
                className="app-button-outline !w-auto !h-9 !px-4 !text-xs text-red-400 border-red-500/40"
              >
                Block
              </button>
            )}
            {!isSelf && accountStatus !== 'active' && (
              <button
                type="button"
                onClick={() => onUpdateUserStatus(member.id, 'active')}
                className="app-button-primary !w-auto !h-9 !px-4 !text-xs"
              >
                Restore account
              </button>
            )}
            {isSelf && (
              <p className="text-xs text-brand-text-muted">Use another director account to suspend or change this profile.</p>
            )}
          </div>
        </section>
      )}

      {member.bio && (
        <section className="py-4">
          <h3 className="text-sm font-semibold mb-2">Notes</h3>
          <p className="text-sm text-brand-text-muted leading-relaxed">{member.bio}</p>
        </section>
      )}
    </div>
  );
}
