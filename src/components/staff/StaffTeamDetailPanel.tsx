import React, { useEffect, useState } from 'react';
import { PlatformRole, SecurityGuard, StaffRole } from '../../types';
import {
  confirmApproveStaffAccount,
  confirmBlockAccount,
  confirmRejectStaffAccount,
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
  canAssignStaffCityAccess,
  platformStaffRank,
  staffRoleRank,
} from '../../lib/permissions';
import type { PlatformCity } from '../../lib/platformCities';
import {
  getAssignableCityNamesForStaffAccess,
  normalizeManagedCities,
} from '../../lib/platformCities';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge } from '../ui/wireframe';
import { AppButton } from '../ui/AppButton';
import { StaffOperationsAccessPicker } from './StaffOperationsAccessPicker';
import { StaffStaffApplicationSummary } from './StaffStaffApplicationSummary';
import { showAppToast } from '../ui/AppToast';
import { ArrowLeft } from 'lucide-react';

interface StaffTeamDetailPanelProps {
  member: SecurityGuard;
  platformCities?: PlatformCity[];
  managerOptions?: SecurityGuard[];
  currentUserId: string;
  currentUserRole: PlatformRole;
  actorManagedCities?: string[];
  canManageStaff: boolean;
  canApproveStaffAccounts?: boolean;
  onUpdateUserStatus: (id: string, status: 'active' | 'suspended' | 'blocked') => void;
  onApproveStaffAccount?: (staffId: string) => void | Promise<void>;
  onRejectStaffAccount?: (staffId: string) => void | Promise<void>;
  onUpdateStaffRole?: (staffId: string, role: StaffRole) => Promise<void>;
  onUpdateStaffCityAccess?: (
    staffId: string,
    patch: { managedCities?: string[]; assignedManagerIds?: string[] }
  ) => Promise<void>;
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
  platformCities = [],
  managerOptions = [],
  currentUserId,
  currentUserRole,
  actorManagedCities = [],
  canManageStaff,
  canApproveStaffAccounts = false,
  onUpdateUserStatus,
  onApproveStaffAccount,
  onRejectStaffAccount,
  onUpdateStaffRole,
  onUpdateStaffCityAccess,
  onBack,
}: StaffTeamDetailPanelProps) {
  const accountStatus = member.userStatus || 'active';
  const isPending = accountStatus === 'pending';
  const [role, setRole] = useState<StaffRole>(member.staffRole || 'Moderator');
  const [roleMsg, setRoleMsg] = useState('');
  const [roleError, setRoleError] = useState('');
  const [savingRole, setSavingRole] = useState(false);
  const [managedCities, setManagedCities] = useState<string[]>(member.managedCities ?? []);
  const [assignedManagerIds, setAssignedManagerIds] = useState<string[]>(
    member.assignedManagerIds ?? []
  );
  const [cityMsg, setCityMsg] = useState('');
  const [cityError, setCityError] = useState('');
  const [savingCities, setSavingCities] = useState(false);
  const [reviewPending, setReviewPending] = useState(false);

  useEffect(() => {
    setRole(member.staffRole || 'Moderator');
    setRoleMsg('');
    setRoleError('');
    setManagedCities(member.managedCities ?? []);
    setAssignedManagerIds(member.assignedManagerIds ?? []);
    setCityMsg('');
    setCityError('');
  }, [member.id, member.staffRole, member.managedCities, member.assignedManagerIds]);

  const platformRole = staffRoleToPlatformRole(role);
  const assignableRoles = getAssignableStaffRoles(currentUserRole);
  const canModifyMember =
    canManageStaff && canModerateStaffMember(currentUserRole, currentUserId, member);
  const blockedReason = staffModerationBlockedReason(currentUserRole, currentUserId, member);
  const canEditCityAccess =
    canModifyMember &&
    canAssignStaffCityAccess({ role: currentUserRole }) &&
    Boolean(onUpdateStaffCityAccess);
  const assignableCityNames = getAssignableCityNamesForStaffAccess(
    platformCities,
    currentUserRole,
    actorManagedCities
  );

  const handleCityAccessSave = async () => {
    if (!onUpdateStaffCityAccess) return;
    setCityError('');
    setCityMsg('');
    setSavingCities(true);
    try {
      await onUpdateStaffCityAccess(member.id, {
        managedCities: normalizeManagedCities(managedCities, platformCities),
        assignedManagerIds,
      });
      setCityMsg('Service Areas access updated.');
    } catch (err) {
      setCityError(err instanceof Error ? err.message : 'Could not update Service Areas access.');
    } finally {
      setSavingCities(false);
    }
  };

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

  const displayName = member.badgeNumber || member.name;

  const handleApproveApplication = async () => {
    if (!onApproveStaffAccount) return;
    if (!(await confirmApproveStaffAccount(displayName))) return;
    setReviewPending(true);
    try {
      await onApproveStaffAccount(member.id);
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not approve staff account.', {
        tone: 'error',
      });
    } finally {
      setReviewPending(false);
    }
  };

  const handleRejectApplication = async () => {
    if (!onRejectStaffAccount) return;
    if (!(await confirmRejectStaffAccount(displayName))) return;
    setReviewPending(true);
    try {
      await onRejectStaffAccount(member.id);
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not reject staff account.', {
        tone: 'error',
      });
    } finally {
      setReviewPending(false);
    }
  };

  return (
    <div className="staff-detail-pane h-full overflow-y-auto space-y-0">
      {onBack && (
        <div className="app-subscreen-header app-subscreen-header--back-only">
          <button type="button" onClick={onBack} className="app-subscreen-back">
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Back to Team
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
            {isPending && <WfBadge tone="warning">Pending Director approval</WfBadge>}
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

      {isPending && (
        <>
          <StaffStaffApplicationSummary member={member} />
          {(canApproveStaffAccounts && (onApproveStaffAccount || onRejectStaffAccount)) ? (
            <section className="staff-detail-section space-y-2">
              <h3 className="text-sm font-semibold">Application review</h3>
              <div className="app-action-row--equal">
                {onApproveStaffAccount && (
                  <AppButton
                    variant="primary"
                    size="sm"
                    onClick={() => void handleApproveApplication()}
                    disabled={reviewPending}
                  >
                    Approve application
                  </AppButton>
                )}
                {onRejectStaffAccount && (
                  <AppButton
                    variant="danger"
                    size="sm"
                    onClick={() => void handleRejectApplication()}
                    disabled={reviewPending}
                  >
                    Deny application
                  </AppButton>
                )}
              </div>
            </section>
          ) : (
            <section className="staff-detail-section space-y-2">
              <h3 className="text-sm font-semibold">Application review</h3>
              <p className="text-xs text-brand-text-muted">
                Only Directors and Founders can approve or deny staff applications.
              </p>
            </section>
          )}
        </>
      )}

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
              <AppButton variant="primary" size="sm" onClick={handleRoleSave} disabled={savingRole}>
                {savingRole ? 'Saving…' : `Save as ${role}`}
              </AppButton>
            )}
            {roleError && <p className="text-sm text-red-400">{roleError}</p>}
            {roleMsg && <p className="text-sm text-brand-primary">{roleMsg}</p>}
          </div>
        ) : (
          <p className="text-sm text-brand-text-muted">{blockedReason}</p>
        )}
      </section>

      {canEditCityAccess && assignableCityNames.length > 0 && (
        <section className="staff-detail-section space-y-3">
          <h3 className="text-sm font-semibold">Service Areas access</h3>
          <p className="text-xs text-brand-text-muted leading-relaxed">
            Choose which cities this staff member may manage in Service Areas. Directors control
            manager assignments; managers may assign cities within their own scope.
          </p>
          <StaffOperationsAccessPicker
            id={`staff-ops-access-${member.id}`}
            cityNames={assignableCityNames}
            selected={managedCities}
            onChange={setManagedCities}
          />
          {currentUserRole === 'owner' || currentUserRole === 'director' ? (
            <div className="space-y-2">
              <label className="uber-label block">Assigned managers</label>
              <select
                multiple
                value={assignedManagerIds}
                onChange={(e) =>
                  setAssignedManagerIds(
                    Array.from(e.target.selectedOptions).map((option) => option.value)
                  )
                }
                className="uber-select w-full min-h-[6rem]"
              >
                {managerOptions.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.badgeNumber || manager.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <AppButton
            variant="primary"
            size="sm"
            onClick={() => void handleCityAccessSave()}
            disabled={savingCities}
          >
            {savingCities ? 'Saving…' : 'Save Service Areas access'}
          </AppButton>
          {cityError && <p className="text-sm text-red-400">{cityError}</p>}
          {cityMsg && <p className="text-sm text-brand-primary">{cityMsg}</p>}
        </section>
      )}

      {canModifyMember ? (
        <section className="staff-detail-section space-y-2">
          <h3 className="text-sm font-semibold">Account controls</h3>
          <div className="app-action-row--equal">
            {accountStatus !== 'suspended' && (
              <AppButton variant="outline" size="sm" onClick={() => void handleUpdateUserStatus('suspended')}>
                Suspend
              </AppButton>
            )}
            {accountStatus !== 'blocked' && (
              <AppButton variant="danger" size="sm" onClick={() => void handleUpdateUserStatus('blocked')}>
                Block
              </AppButton>
            )}
            {accountStatus !== 'active' && (
              <AppButton variant="primary" size="sm" onClick={() => void handleUpdateUserStatus('active')}>
                Restore account
              </AppButton>
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
