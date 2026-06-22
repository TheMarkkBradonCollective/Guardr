import React, { useState } from 'react';
import { StaffRole } from '../../types';
import { Plus, X } from 'lucide-react';
import { STAFF_PROVISIONED_DEFAULT_PASSWORD } from '../../lib/accountPasswords';
import { PersonNameFields } from '../profile/PersonNameFields';
import { personNameFromPayload } from '../../lib/personName';

export interface StaffAddStaffInput {
  name: string;
  email: string;
  badgeNumber: string;
  staffRole: StaffRole;
}

interface StaffAddStaffFormProps {
  assignableRoles: StaffRole[];
  onAdd: (input: StaffAddStaffInput) => Promise<string | void>;
  onCreated?: (staffId: string) => void;
}

export function StaffAddStaffForm({ assignableRoles, onAdd, onCreated }: StaffAddStaffFormProps) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [badge, setBadge] = useState('');
  const [role, setRole] = useState<StaffRole>(assignableRoles[0] ?? 'Moderator');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setEmail('');
    setBadge('');
    setRole(assignableRoles[0] ?? 'Moderator');
    setError('');
    setMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !badge.trim()) {
      setError('First name, last name, email, and badge number are required.');
      return;
    }
    setSaving(true);
    try {
      const displayName = personNameFromPayload({
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
      }).name;
      const staffId = await onAdd({
        name: displayName,
        email: email.trim(),
        badgeNumber: badge.trim(),
        staffRole: role,
      });
      setMsg(
        `${displayName} added as ${role}. Default sign-in password: ${STAFF_PROVISIONED_DEFAULT_PASSWORD}.`
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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="app-button-primary !w-auto !h-9 !px-4 !text-sm inline-flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add staff
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="staff-onboard-form border border-brand-border rounded-xl p-4 space-y-4 bg-brand-bg-sec/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Add platform staff</h3>
          <p className="text-xs text-brand-text-muted mt-1">
            Staff manage the platform only — they cannot accept field jobs. Default sign-in password:{' '}
            <span className="font-mono text-brand-text">{STAFF_PROVISIONED_DEFAULT_PASSWORD}</span>
            {' '}— they will be prompted to change it on first login.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError('');
            setMsg('');
          }}
          className="p-1.5 rounded-lg text-brand-text-muted hover:text-brand-text hover:bg-brand-border/20"
          aria-label="Close form"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

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
          <label className="uber-label block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="uber-input w-full"
            placeholder="staff@example.com"
            required
          />
        </div>
        <div>
          <label className="uber-label block mb-1">Badge number</label>
          <input
            type="text"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            className="uber-input w-full"
            placeholder="STF-00001"
            required
          />
        </div>
        <div>
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

      {error && <p className="text-sm text-red-400">{error}</p>}
      {msg && <p className="text-sm text-brand-primary">{msg}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className="app-button-primary !w-auto !h-10 !px-5">
          {saving ? 'Adding…' : 'Create staff account'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError('');
          }}
          className="app-button-outline !w-auto !h-10 !px-5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
