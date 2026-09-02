import React, { useEffect, useState } from 'react';
import { PlatformRole, SecurityGuard, StaffRole, StaffSideRole } from '../../types';
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
  canAssignStaffSideRole,
  canEditStaffProfile,
  platformStaffRank,
  staffRoleRank,
} from '../../lib/permissions';
import type { PlatformCity } from '../../lib/platformCities';
import {
  getAssignableCityNamesForStaffAccess,
  normalizeManagedCities,
} from '../../lib/platformCities';
import { isExecutiveStaffRole, staffRequiresCityAssignment } from '../../lib/staffCityAccess';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { StaffProfileSection, type StaffProfilePayload } from '../profile/StaffProfileSection';
import type { ProfileSavePayload } from '../profile/UserProfileScreen';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { AppButton } from '../ui/AppButton';
import { StaffOperationsAccessPicker } from './StaffOperationsAccessPicker';
import { StaffStaffApplicationSummary } from './StaffStaffApplicationSummary';
import { showAppToast } from '../ui/AppToast';
import { ArrowLeft, Mail, Phone, Save, User } from 'lucide-react';
import { getStaffDisplayName } from '../../lib/staffProfile';
import { getStaffRosterStatusLabel } from '../../lib/staffAccountActivation';
import {
  nextFinanceDeskBadgeNumberForChange,
  nextStaffBadgeNumberForRoleChange,
  STAFF_BADGE_PREFIX,
  FINANCE_DESK_BADGE_PREFIX,
} from '../../lib/staffBadgeNumber';
import type { PlatformSettings } from '../../lib/platformSettings';
import type { StaffTeamDetailTab } from '../../lib/appNavigation';
import { StaffListFilterTabs } from './StaffListFilterTabs';
import { StaffTimesheetsPanel } from './StaffTimesheetsPanel';
import { StaffDetailProfileHeader } from './StaffDetailProfileHeader';
import { StaffAccountAccessSection } from './StaffAccountAccessSection';

interface StaffTeamDetailPanelProps {
  member: SecurityGuard;
  roster?: SecurityGuard[];
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
  staffTeamTab?: StaffTeamDetailTab;
  onStaffTeamTabChange?: (tab: StaffTeamDetailTab) => void;
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
  if (!member.staffRole && member.sideRole === 'Finance') {
    return 'Only Directors and Founders can manage Finance desk seats.';
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
  roster = [],
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
  onUpdateStaffProfile,
  platformSettings,
  staffTeamTab = 'profile',
  onStaffTeamTabChange,
  onBack,
}: StaffTeamDetailPanelProps) {
  const accountStatus = member.userStatus || 'pending';
  const isPending = accountStatus === 'pending';
  const isInactive = accountStatus === 'approved';
  const rosterStatusLabel = getStaffRosterStatusLabel(member);
  const [role, setRole] = useState<StaffRole | ''>(member.staffRole || '');
  const [sideRoleFinance, setSideRoleFinance] = useState(member.sideRole === 'Finance');
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
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [phone, setPhone] = useState(member.phone ?? '');
  const [personalEmail, setPersonalEmail] = useState(member.personalEmail ?? '');
  const [staffProfile, setStaffProfile] = useState<StaffProfilePayload>({
    headline: member.headline ?? '',
    summary: member.summary ?? '',
    about: member.about ?? member.bio ?? '',
    specialties: member.specialties ?? [],
  });

  useEffect(() => {
    setEditingProfile(false);
    setProfileError('');
    setProfileMsg('');
    setPhone(member.phone ?? '');
    setPersonalEmail(member.personalEmail ?? '');
    setStaffProfile({
      headline: member.headline ?? '',
      summary: member.summary ?? '',
      about: member.about ?? member.bio ?? '',
      specialties: member.specialties ?? [],
    });
    setRole(member.staffRole || '');
    setSideRoleFinance(member.sideRole === 'Finance');
    setRoleMsg('');
    setRoleError('');
    setManagedCities(member.managedCities ?? []);
    setAssignedManagerIds(member.assignedManagerIds ?? []);
    setCityMsg('');
    setCityError('');
  }, [
    member.id,
    member.staffRole,
    member.sideRole,
    member.managedCities,
    member.assignedManagerIds,
    member.headline,
    member.summary,
    member.about,
    member.bio,
    member.specialties,
    member.phone,
    member.personalEmail,
  ]);

  const nextStaffRole: StaffRole | null = role || null;
  const nextSideRole: StaffSideRole | null = sideRoleFinance ? 'Finance' : null;
  const platformRole = nextStaffRole
    ? staffRoleToPlatformRole(nextStaffRole)
    : nextSideRole === 'Finance'
      ? 'finance'
      : 'moderator';
  const assignableRoles = getAssignableStaffRoles(currentUserRole);
  const canAssignFinanceSide = canAssignStaffSideRole(currentUserRole);
  const roleDirty =
    nextStaffRole !== (member.staffRole ?? null) ||
    nextSideRole !== (member.sideRole ?? null);
  const pendingBadge = !nextStaffRole && nextSideRole === 'Finance'
    ? nextFinanceDeskBadgeNumberForChange(roster, member.id)
    : nextStaffRole && nextStaffRole !== member.staffRole
      ? nextStaffBadgeNumberForRoleChange(nextStaffRole, roster, member.id)
      : member.badgeNumber;
  const canModifyMember =
    canManageStaff && canModerateStaffMember(currentUserRole, currentUserId, member);
  const blockedReason = staffModerationBlockedReason(currentUserRole, currentUserId, member);
  const canEditProfile =
    Boolean(onUpdateStaffProfile) &&
    canEditStaffProfile(currentUserRole, currentUserId, member);
  const memberRequiresCity = staffRequiresCityAssignment(member.staffRole);
  const memberIsExecutive = isExecutiveStaffRole(member.staffRole);
  const memberIsManager = member.staffRole === 'Manager';
  const canEditMemberCityAccess =
    canModifyMember &&
    canAssignStaffCityAccess({ role: currentUserRole }) &&
    memberRequiresCity &&
    !memberIsManager &&
    Boolean(onUpdateStaffCityAccess);
  const assignableCityNames = getAssignableCityNamesForStaffAccess(
    platformCities,
    currentUserRole,
    actorManagedCities
  );

  const handleProfileSave = async () => {
    if (!onUpdateStaffProfile) return;
    setProfileError('');
    setProfileMsg('');
    setProfileSaving(true);
    try {
      await onUpdateStaffProfile(member.id, {
        name: member.name,
        firstName: member.firstName ?? member.name.split(' ')[0] ?? '',
        middleName: member.middleName,
        lastName: member.lastName ?? member.name.split(' ').slice(-1)[0] ?? '',
        phone: phone.trim(),
        personalEmail: personalEmail.trim(),
        bio: staffProfile.about,
        headline: staffProfile.headline,
        summary: staffProfile.summary,
        about: staffProfile.about,
        specialties: staffProfile.specialties,
      });
      setProfileMsg('Profile updated.');
      setEditingProfile(false);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Could not update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

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
    if (!onUpdateStaffRole || !roleDirty) return;
    if (!nextStaffRole && nextSideRole !== 'Finance') {
      setRoleError('Choose a ladder role, or keep Finance side role for a stagnant Finance desk seat.');
      return;
    }
    const roleLabel = !nextStaffRole
      ? 'Finance desk (no ladder role)'
      : nextSideRole
        ? `${nextStaffRole} + Finance`
        : nextStaffRole;
    if (!(await confirmStaffRoleChange(
      getStaffDisplayName(member),
      roleLabel,
      pendingBadge !== member.badgeNumber ? pendingBadge : undefined
    ))) return;
    setRoleError('');
    setRoleMsg('');
    setSavingRole(true);
    try {
      const result = await onUpdateStaffRole(member.id, nextStaffRole, { sideRole: nextSideRole });
      const badgeNumber =
        result && 'badgeNumber' in result ? result.badgeNumber : pendingBadge;
      setRoleMsg(
        badgeNumber !== member.badgeNumber
          ? `Role updated to ${roleLabel}. Staff ID is now ${badgeNumber}.`
          : `Role updated to ${roleLabel}.`
      );
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

  const displayName = getStaffDisplayName(member);
  const memberManagedCities = (member.managedCities ?? []).filter(Boolean);

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

      {platformSettings && onStaffTeamTabChange ? (
        <div className="staff-guard-detail-tabs">
          <StaffListFilterTabs
            aria-label="Staff detail"
            activeId={staffTeamTab}
            onChange={(id) => onStaffTeamTabChange(id as StaffTeamDetailTab)}
            tabs={[
              { id: 'profile', label: 'Profile' },
              { id: 'timesheets', label: 'Timesheets' },
            ]}
          />
        </div>
      ) : null}

      <StaffDetailProfileHeader
        avatar={<ProfileAvatar src={member.avatar} name={displayName} size="lg" rounded="xl" />}
        name={
          <>
            <h2 className="font-bold text-lg">{displayName}</h2>
            {member.id === currentUserId && <WfBadge tone="primary">You</WfBadge>}
          </>
        }
        email={member.email}
        emailPrefix="Work · "
        contact={
          <div className="staff-profile-contact-row mt-2">
            {member.personalEmail?.trim() && (
              <a href={`mailto:${member.personalEmail}`} className="staff-profile-contact-link">
                <Mail className="w-3.5 h-3.5" aria-hidden />
                <span>
                  <span className="text-brand-text-muted">Personal · </span>
                  {member.personalEmail}
                </span>
              </a>
            )}
            {member.phone?.trim() && (
              <a href={`tel:${member.phone}`} className="staff-profile-contact-link">
                <Phone className="w-3.5 h-3.5" aria-hidden />
                {member.phone}
              </a>
            )}
          </div>
        }
        metrics={[
          { label: 'Staff ID', value: member.badgeNumber || '—' },
          ...(memberManagedCities.length > 0
            ? [{ label: 'Service areas', value: memberManagedCities.join(', ') }]
            : []),
        ]}
        badges={
          <>
            <WfBadge tone="primary">{member.staffRole || 'Staff'}</WfBadge>
            {isPending && <WfBadge tone="warning">Pending Director approval</WfBadge>}
            {isInactive && <WfBadge>Inactive</WfBadge>}
          </>
        }
      />

      {staffTeamTab === 'timesheets' && platformSettings ? (
        <section className="staff-detail-section space-y-3">
          <StaffTimesheetsPanel
            staffId={member.id}
            platformSettings={platformSettings}
            showManagerHint
          />
        </section>
      ) : (
        <>
      <StaffAccountAccessSection
        title={isPending ? 'Application review' : 'Account access'}
        leading={
          canEditProfile && !isPending ? (
            editingProfile ? (
              <>
                <AppButton
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => void handleProfileSave()}
                  disabled={profileSaving}
                  startEnhancer={<Save className="w-3.5 h-3.5" />}
                >
                  {profileSaving ? 'Saving…' : 'Save changes'}
                </AppButton>
                <AppButton
                  variant="outline"
                  size="sm"
                  fullWidth
                  disabled={profileSaving}
                  onClick={() => {
                    setEditingProfile(false);
                    setProfileError('');
                    setPhone(member.phone ?? '');
                    setPersonalEmail(member.personalEmail ?? '');
                    setStaffProfile({
                      headline: member.headline ?? '',
                      summary: member.summary ?? '',
                      about: member.about ?? member.bio ?? '',
                      specialties: member.specialties ?? [],
                    });
                  }}
                >
                  Cancel
                </AppButton>
              </>
            ) : (
              <AppButton
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => setEditingProfile(true)}
                startEnhancer={<User className="w-3.5 h-3.5" />}
              >
                Edit profile
              </AppButton>
            )
          ) : undefined
        }
        leadingClassName={editingProfile ? '' : undefined}
      >
        {isPending &&
        canApproveStaffAccounts &&
        (onApproveStaffAccount || onRejectStaffAccount) ? (
          <>
            {onApproveStaffAccount && (
              <AppButton
                variant="primary"
                size="sm"
                className="staff-action-btn--ok"
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
                className="staff-action-btn--danger"
                onClick={() => void handleRejectApplication()}
                disabled={reviewPending}
              >
                Deny application
              </AppButton>
            )}
          </>
        ) : !isPending && canModifyMember ? (
          <>
            {accountStatus !== 'suspended' && (
              <AppButton
                variant="outline"
                size="sm"
                className="staff-action-btn--warn"
                onClick={() => void handleUpdateUserStatus('suspended')}
              >
                Deactivate
              </AppButton>
            )}
            {accountStatus !== 'blocked' && (
              <AppButton
                variant="danger"
                size="sm"
                className="staff-action-btn--danger"
                onClick={() => void handleUpdateUserStatus('blocked')}
              >
                Block
              </AppButton>
            )}
            {accountStatus !== 'active' && (
              <AppButton
                variant="primary"
                size="sm"
                className="staff-action-btn--ok"
                onClick={() => void handleUpdateUserStatus('active')}
              >
                Restore account
              </AppButton>
            )}
          </>
        ) : null}
      </StaffAccountAccessSection>

      {isPending &&
        canApproveStaffAccounts &&
        !onApproveStaffAccount &&
        !onRejectStaffAccount && (
          <section className="staff-detail-section space-y-2">
            <p className="text-xs text-brand-text-muted">
              Only Directors and Founders can approve or deny staff applications.
            </p>
          </section>
        )}

      {!isPending && canManageStaff && !canModifyMember && (
        <section className="staff-detail-section space-y-2">
          <p className="text-xs text-brand-text-muted">{blockedReason}</p>
        </section>
      )}

      {!isPending && (
        <section className="staff-detail-section space-y-3">
          <WfSectionHeader title="Team profile" className="!px-0 !mb-0" />
          {editingProfile ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1 sm:col-span-2">
                  <span className="uber-label">Phone</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="uber-input w-full"
                  />
                </label>
                <label className="block space-y-1 sm:col-span-2">
                  <span className="uber-label">Personal email</span>
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    className="uber-input w-full"
                  />
                </label>
              </div>
              <StaffProfileSection
                member={member}
                editing
                payload={staffProfile}
                onChange={(patch) => setStaffProfile((prev) => ({ ...prev, ...patch }))}
              />
              {profileError && <p className="text-sm text-red-400">{profileError}</p>}
            </>
          ) : (
            <StaffProfileSection member={member} />
          )}
          {profileMsg && !editingProfile && (
            <p className="text-sm text-brand-primary">{profileMsg}</p>
          )}
        </section>
      )}

      {(isPending || isInactive) && <StaffStaffApplicationSummary member={member} />}

      <section className="staff-detail-section space-y-3">
        <WfSectionHeader title="Platform role" className="!px-0 !mb-0" />
        <p className="text-xs text-brand-text-muted leading-relaxed">
          {ROLE_DESCRIPTIONS[platformRole]}
        </p>
        {member.sideRole === 'Finance' && (
          <p className="text-xs text-brand-text-muted leading-relaxed">
            Side role: Finance
            {!member.staffRole ? ' — ladder role is null/stagnant (payment desk only).' : ' — payment tools added on top of the ladder role.'}
          </p>
        )}
        {roleDirty && pendingBadge !== member.badgeNumber && (
          <p className="text-xs text-brand-primary leading-relaxed">
            Staff ID will change to {pendingBadge} (
            {!nextStaffRole ? FINANCE_DESK_BADGE_PREFIX : STAFF_BADGE_PREFIX[nextStaffRole!]} series).
          </p>
        )}
        {canModifyMember && onUpdateStaffRole ? (
          <div className="space-y-2 max-w-sm">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole | '')}
              className="uber-select w-full"
            >
              {canAssignFinanceSide && (
                <option value="">None — stagnant (Finance desk)</option>
              )}
              {assignableRoles.map((staffRole) => (
                <option key={staffRole} value={staffRole}>
                  {staffRole} — {ROLE_LABELS[staffRoleToPlatformRole(staffRole)]}
                </option>
              ))}
            </select>
            {canAssignFinanceSide && (
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sideRoleFinance}
                  onChange={(e) => setSideRoleFinance(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">Finance side role</span>
                  <span className="block text-xs text-brand-text-muted">
                    Payment tools only when ladder role is None; otherwise additive on the ladder seat.
                  </span>
                </span>
              </label>
            )}
            {roleDirty && (
              <AppButton variant="primary" size="sm" onClick={handleRoleSave} disabled={savingRole}>
                {savingRole ? 'Saving…' : 'Save role'}
              </AppButton>
            )}
            {roleError && <p className="text-sm text-red-400">{roleError}</p>}
            {roleMsg && <p className="text-sm text-brand-primary">{roleMsg}</p>}
          </div>
        ) : (
          <p className="text-sm text-brand-text-muted">{blockedReason}</p>
        )}
      </section>

      {memberIsExecutive && (
        <section className="staff-detail-section space-y-2">
          <WfSectionHeader title="Service areas" className="!px-0 !mb-0" />
          <p className="text-xs text-brand-text-muted leading-relaxed">
            Directors and Founders run the full platform and are not assigned to a single city.
          </p>
        </section>
      )}

      {memberIsManager && memberRequiresCity && (
        <section className="staff-detail-section space-y-2">
          <WfSectionHeader title="City assignment" className="!px-0 !mb-0" />
          <p className="text-xs text-brand-text-muted leading-relaxed">
            City managers are assigned in Service Areas. Each Manager runs one city only.
          </p>
          <p className="text-sm">
            {memberManagedCities.length > 0 ? memberManagedCities.join(', ') : 'No city assigned yet'}
          </p>
        </section>
      )}

      {canEditMemberCityAccess && assignableCityNames.length > 0 && (
        <section className="staff-detail-section space-y-3">
          <WfSectionHeader title="City assignment" className="!px-0 !mb-0" />
          <p className="text-xs text-brand-text-muted leading-relaxed">
            Assign the cities this staff member may work in. Directors and Founders set city
            managers in Service Areas.
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
        </>
      )}
    </div>
  );
}
