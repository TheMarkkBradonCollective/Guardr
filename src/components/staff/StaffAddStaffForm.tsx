import React, { useEffect, useMemo, useState } from 'react';
import { StaffRole, PlatformRole, StaffSideRole } from '../../types';
import { Plus } from 'lucide-react';
import { STAFF_PROVISIONED_DEFAULT_PASSWORD } from '../../lib/accountPasswords';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { useStaffCreateFormOpen } from './useStaffCreateFormOpen';
import type { PlatformCity } from '../../lib/platformCities';
import { getAssignableCityNamesForStaffAccess } from '../../lib/platformCities';
import { isExecutiveStaffRole, staffRequiresCityAssignment } from '../../lib/staffCityAccess';
import { StaffOperationsAccessPicker } from './StaffOperationsAccessPicker';
import { canAssignStaffSideRole } from '../../lib/permissions';

import {
  nextFinanceDeskBadgeNumber,
  nextStaffBadgeNumber,
  staffBadgeMatchesFinanceDesk,
  staffBadgeMatchesRole,
  validateFinanceDeskBadgeNumber,
  validateStaffBadgeNumber,
} from '../../lib/staffBadgeNumber';
import { PersonNameFields } from '../profile/PersonNameFields';
import { personNameFromPayload } from '../../lib/personName';

export interface StaffAddStaffInput {
  email: string;
  personalEmail?: string;
  badgeNumber: string;
  /** Null when Finance desk only (stagnant ladder seat). */
  staffRole: StaffRole | null;
  sideRole?: StaffSideRole | null;
  firstName: string;
  middleName?: string;
  lastName: string;
  managedCities?: string[];
  assignedManagerIds?: string[];
}

interface StaffAddStaffFormProps {
  assignableRoles: StaffRole[];
  requiresDirectorApproval?: boolean;
  actorRole: PlatformRole;
  platformCities?: PlatformCity[];
  actorManagedCities?: string[];
  managerOptions?: Array<{ id: string; badgeNumber?: string; name: string }>;
  roster: Array<{ badgeNumber: string; isStaff?: boolean }>;
  onAdd: (input: StaffAddStaffInput) => Promise<string | void>;
  onCreated?: (staffId: string) => void;
}

export function StaffAddStaffForm({
  assignableRoles,
  requiresDirectorApproval = false,
  actorRole,
  platformCities = [],
  actorManagedCities = [],
  managerOptions = [],
  roster = [],
  onAdd,
  onCreated,
}: StaffAddStaffFormProps) {
  const { open, setOpen, hideTrigger } = useStaffCreateFormOpen('staff');
  const [email, setEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [badge, setBadge] = useState('');
  const [role, setRole] = useState<StaffRole>(assignableRoles[0] ?? 'Moderator');
  const [financeDeskOnly, setFinanceDeskOnly] = useState(false);
  const [sideRoleFinance, setSideRoleFinance] = useState(false);
  const [managedCities, setManagedCities] = useState<string[]>([]);
  const [assignedManagerIds, setAssignedManagerIds] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const canAssignFinance = canAssignStaffSideRole(actorRole);

  const assignableCityNames = useMemo(
    () => getAssignableCityNamesForStaffAccess(platformCities, actorRole, actorManagedCities),
    [actorManagedCities, actorRole, platformCities]
  );

  const suggestedBadge = useMemo(() => {
    const rosterForBadge = roster.map((member) => ({
      badgeNumber: member.badgeNumber,
      isStaff: true as const,
    }));
    if (financeDeskOnly) return nextFinanceDeskBadgeNumber(rosterForBadge);
    return nextStaffBadgeNumber(role, rosterForBadge);
  }, [financeDeskOnly, role, roster]);

  const applySuggestedBadge = () => setBadge(suggestedBadge);

  useEffect(() => {
    if (!open) return;
    setBadge((current) => {
      if (
        !current.trim() ||
        (financeDeskOnly
          ? staffBadgeMatchesFinanceDesk(current)
          : staffBadgeMatchesRole(current, role))
      ) {
        return suggestedBadge;
      }
      return current;
    });
    if (financeDeskOnly || isExecutiveStaffRole(role)) {
      setManagedCities([]);
    }
  }, [open, role, suggestedBadge, financeDeskOnly]);

  const reset = () => {
    setEmail('');
    setPersonalEmail('');
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setBadge('');
    setRole(assignableRoles[0] ?? 'Moderator');
    setFinanceDeskOnly(false);
    setSideRoleFinance(false);
    setManagedCities([]);
    setAssignedManagerIds([]);
    setError('');
    setMsg('');
  };

  const closeForm = () => {
    setOpen(false);
    setError('');
    setMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');
    const normalizedName = personNameFromPayload({ firstName, middleName, lastName });
    if (!normalizedName.firstName.trim() || !normalizedName.lastName.trim()) {
      setError('First and last name are required.');
      return;
    }
    if (!email.trim() || !badge.trim()) {
      setError('Staff ID and email are required.');
      return;
    }
    if (financeDeskOnly && !canAssignFinance) {
      setError('Only Directors and Founders can create Finance desk seats.');
      return;
    }
    const badgeError = financeDeskOnly
      ? validateFinanceDeskBadgeNumber(badge)
      : validateStaffBadgeNumber(badge, role);
    if (badgeError) {
      setError(badgeError);
      return;
    }
    setSaving(true);
    try {
      const nextSideRole: StaffSideRole | null =
        financeDeskOnly || sideRoleFinance ? 'Finance' : null;
      const staffId = await onAdd({
        email: email.trim(),
        personalEmail: personalEmail.trim() || undefined,
        badgeNumber: badge.trim().toUpperCase(),
        staffRole: financeDeskOnly ? null : role,
        sideRole: nextSideRole,
        firstName: normalizedName.firstName,
        middleName: normalizedName.middleName,
        lastName: normalizedName.lastName,
        managedCities: financeDeskOnly
          ? undefined
          : managedCities.length > 0
            ? managedCities
            : undefined,
        assignedManagerIds: financeDeskOnly
          ? undefined
          : assignedManagerIds.length > 0
            ? assignedManagerIds
            : undefined,
      });
      const roleLabel = financeDeskOnly
        ? 'Finance desk'
        : nextSideRole
          ? `${role} + Finance`
          : role;
      setMsg(
        requiresDirectorApproval
          ? `${badge.trim()} submitted for Director approval.`
          : `${normalizedName.name} (${badge.trim()}) added as ${roleLabel}. Default sign-in password: ${STAFF_PROVISIONED_DEFAULT_PASSWORD}.`
      );
      reset();
      if (staffId) onCreated?.(staffId);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add staff member.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {!hideTrigger ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="app-button-primary !w-auto !h-9 !px-4 !text-sm inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add staff
        </button>
      ) : null}

      <AppFormSheet
        open={open}
        onClose={closeForm}
        title="Add platform staff"
        subtitle={
          requiresDirectorApproval
            ? 'Administrator submissions require Director approval before sign-in.'
            : `Default sign-in password: ${STAFF_PROVISIONED_DEFAULT_PASSWORD}`
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <PersonNameFields
            firstName={firstName}
            middleName={middleName}
            lastName={lastName}
            onFirstNameChange={setFirstName}
            onMiddleNameChange={setMiddleName}
            onLastNameChange={setLastName}
            editing
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="uber-label block mb-1">Staff ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value.toUpperCase())}
                  className="uber-input w-full"
                  placeholder={suggestedBadge}
                  required
                />
                <button
                  type="button"
                  onClick={applySuggestedBadge}
                  className="app-button-outline !w-auto !h-10 !px-3 shrink-0"
                >
                  Use next
                </button>
              </div>
              <p className="text-xs text-brand-text-muted mt-1">
                {financeDeskOnly
                  ? `Finance desk uses FIN prefix. Next: ${suggestedBadge}`
                  : `Role prefix only — never STF. Next for ${role}: ${suggestedBadge}`}
              </p>
            </div>
            <div>
              <label className="uber-label block mb-1">Work email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="uber-input w-full"
                placeholder="name@signaturesecurityspecialist.com"
                required
              />
            </div>
            <div>
              <label className="uber-label block mb-1">Personal email</label>
              <input
                type="email"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                className="uber-input w-full"
                placeholder="personal@gmail.com"
              />
              <p className="text-xs text-brand-text-muted mt-1">
                Optional contact email. Work email is used to sign in.
              </p>
            </div>
            {canAssignFinance && (
              <div className="sm:col-span-2 space-y-2">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={financeDeskOnly}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setFinanceDeskOnly(next);
                      if (next) setSideRoleFinance(true);
                    }}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium">Finance desk only</span>
                    <span className="block text-xs text-brand-text-muted">
                      Ladder role stays null/stagnant — payment tools only.
                    </span>
                  </span>
                </label>
                {!financeDeskOnly && (
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={sideRoleFinance}
                      onChange={(e) => setSideRoleFinance(e.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-medium">Add Finance side role</span>
                      <span className="block text-xs text-brand-text-muted">
                        Keep the ladder role and also grant payment tools.
                      </span>
                    </span>
                  </label>
                )}
              </div>
            )}
            {!financeDeskOnly && (
              <div className="sm:col-span-2">
                <label className="uber-label block mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => {
                    const nextRole = e.target.value as StaffRole;
                    setRole(nextRole);
                    if (nextRole === 'Manager' && managedCities.length > 1) {
                      setManagedCities(managedCities.slice(0, 1));
                    }
                  }}
                  className="uber-select w-full"
                >
                  {assignableRoles.map((staffRole) => (
                    <option key={staffRole} value={staffRole}>
                      {staffRole}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {!financeDeskOnly && staffRequiresCityAssignment(role) && assignableCityNames.length > 0 && (
            <div className="space-y-2">
              <label className="uber-label block">City assignment</label>
              <p className="text-xs text-brand-text-muted">
                {role === 'Manager'
                  ? 'Managers are city managers — assign exactly one city here or in Service Areas.'
                  : 'Assign the cities this staff member may work in.'}
              </p>
              <StaffOperationsAccessPicker
                id="add-staff-operations-access"
                cityNames={assignableCityNames}
                selected={managedCities}
                onChange={setManagedCities}
                maxListHeightClassName="max-h-40"
                mode={role === 'Manager' ? 'single' : 'multiple'}
              />
            </div>
          )}

          {!financeDeskOnly && managerOptions.length > 0 && (
            <div>
              <label className="uber-label block mb-1">Assigned managers</label>
              <select
                multiple
                value={assignedManagerIds}
                onChange={(e) =>
                  setAssignedManagerIds(
                    Array.from(e.target.selectedOptions).map((option) => option.value)
                  )
                }
                className="uber-select w-full min-h-[5rem]"
              >
                {managerOptions.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.badgeNumber || manager.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
          {msg && <p className="text-sm text-brand-primary">{msg}</p>}

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className="app-button-primary !w-auto !h-10 !px-5">
              {saving ? 'Submitting…' : requiresDirectorApproval ? 'Submit for approval' : 'Create staff account'}
            </button>
            <button type="button" onClick={closeForm} className="app-button-outline !w-auto !h-10 !px-5">
              Cancel
            </button>
          </div>
        </form>
      </AppFormSheet>
    </>
  );
}
