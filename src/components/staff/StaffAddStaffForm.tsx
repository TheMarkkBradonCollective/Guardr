import React, { useEffect, useMemo, useState } from 'react';
import { StaffRole, PlatformRole } from '../../types';
import { Plus } from 'lucide-react';
import { STAFF_PROVISIONED_DEFAULT_PASSWORD } from '../../lib/accountPasswords';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { useStaffCreateFormOpen } from './useStaffCreateFormOpen';
import type { PlatformCity } from '../../lib/platformCities';
import { getAssignableCityNamesForStaffAccess } from '../../lib/platformCities';
import { isExecutiveStaffRole, staffRequiresCityAssignment } from '../../lib/staffCityAccess';
import { StaffOperationsAccessPicker } from './StaffOperationsAccessPicker';

import {
  nextStaffBadgeNumber,
  staffBadgeMatchesRole,
  validateStaffBadgeNumber,
} from '../../lib/staffBadgeNumber';
import { PersonNameFields } from '../profile/PersonNameFields';
import { personNameFromPayload } from '../../lib/personName';

export interface StaffAddStaffInput {
  email: string;
  personalEmail?: string;
  badgeNumber: string;
  staffRole: StaffRole;
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
  const [managedCities, setManagedCities] = useState<string[]>([]);
  const [assignedManagerIds, setAssignedManagerIds] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const assignableCityNames = useMemo(
    () => getAssignableCityNamesForStaffAccess(platformCities, actorRole, actorManagedCities),
    [actorManagedCities, actorRole, platformCities]
  );

  const suggestedBadge = useMemo(
    () => nextStaffBadgeNumber(role, roster.map((member) => ({ badgeNumber: member.badgeNumber, isStaff: true }))),
    [role, roster]
  );

  const applySuggestedBadge = () => setBadge(suggestedBadge);

  useEffect(() => {
    if (!open) return;
    setBadge((current) => {
      if (!current.trim() || staffBadgeMatchesRole(current, role)) {
        return suggestedBadge;
      }
      return current;
    });
    if (isExecutiveStaffRole(role)) {
      setManagedCities([]);
    }
  }, [open, role, suggestedBadge]);

  const reset = () => {
    setEmail('');
    setPersonalEmail('');
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setBadge('');
    setRole(assignableRoles[0] ?? 'Moderator');
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
    const badgeError = validateStaffBadgeNumber(badge, role);
    if (badgeError) {
      setError(badgeError);
      return;
    }
    setSaving(true);
    try {
      const staffId = await onAdd({
        email: email.trim(),
        personalEmail: personalEmail.trim() || undefined,
        badgeNumber: badge.trim().toUpperCase(),
        staffRole: role,
        firstName: normalizedName.firstName,
        middleName: normalizedName.middleName,
        lastName: normalizedName.lastName,
        managedCities: managedCities.length > 0 ? managedCities : undefined,
        assignedManagerIds: assignedManagerIds.length > 0 ? assignedManagerIds : undefined,
      });
      setMsg(
        requiresDirectorApproval
          ? `${badge.trim()} submitted for Director approval.`
          : `${normalizedName.name} (${badge.trim()}) added as ${role}. Default sign-in password: ${STAFF_PROVISIONED_DEFAULT_PASSWORD}.`
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
                Role prefix only — never STF. Next for {role}: {suggestedBadge}
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
            <div className="sm:col-span-2">
              <label className="uber-label block mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="uber-select w-full"
              >
                {assignableRoles.map((staffRole) => (
                  <option key={staffRole} value={staffRole}>
                    {staffRole}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {staffRequiresCityAssignment(role) && assignableCityNames.length > 0 && (
            <div className="space-y-2">
              <label className="uber-label block">City assignment</label>
              <p className="text-xs text-brand-text-muted">
                {role === 'Manager'
                  ? 'Managers are usually assigned as city managers in Service Areas. You can also select cities here when onboarding.'
                  : 'Assign the cities this staff member may work in.'}
              </p>
              <StaffOperationsAccessPicker
                id="add-staff-operations-access"
                cityNames={assignableCityNames}
                selected={managedCities}
                onChange={setManagedCities}
                maxListHeightClassName="max-h-40"
              />
            </div>
          )}

          {managerOptions.length > 0 && (
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
