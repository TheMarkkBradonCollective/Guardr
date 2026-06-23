import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { STAFF_PROVISIONED_DEFAULT_PASSWORD } from '../../lib/accountPasswords';
import { PersonNameFields } from '../profile/PersonNameFields';
import { personNameFromPayload } from '../../lib/personName';
import { AppFormSheet } from '../ui/app/AppFormSheet';

export interface StaffAddGuardInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  badgeNumber: string;
  hourlyRate: number;
}

interface StaffAddGuardFormProps {
  onAdd: (input: StaffAddGuardInput) => Promise<string | void>;
  onCreated?: (guardId: string) => void;
}

export function StaffAddGuardForm({ onAdd, onCreated }: StaffAddGuardFormProps) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [hourlyRate, setHourlyRate] = useState('35');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setBadgeNumber('');
    setHourlyRate('35');
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
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('First name, last name, and email are required.');
      return;
    }
    setSaving(true);
    try {
      const guardId = await onAdd({
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        badgeNumber: badgeNumber.trim(),
        hourlyRate: parseInt(hourlyRate, 10) || 35,
      });
      setMsg(
        `${personNameFromPayload({ firstName: firstName.trim(), middleName: middleName.trim(), lastName: lastName.trim() }).name} added. They sign in with this email and the default password ${STAFF_PROVISIONED_DEFAULT_PASSWORD}.`
      );
      reset();
      if (guardId) onCreated?.(guardId);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add guard.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="app-button-primary !w-auto !h-9 !px-4 !text-sm inline-flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add guard
      </button>

      <AppFormSheet
        open={open}
        onClose={closeForm}
        title="Add field guard"
        subtitle={`Default sign-in password: ${STAFF_PROVISIONED_DEFAULT_PASSWORD}`}
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
              <label className="uber-label block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="uber-input w-full"
                placeholder="guard@example.com"
                required
              />
            </div>
            <div>
              <label className="uber-label block mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="uber-input w-full"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="uber-label block mb-1">Badge number</label>
              <input
                type="text"
                value={badgeNumber}
                onChange={(e) => setBadgeNumber(e.target.value)}
                className="uber-input w-full"
                placeholder="Auto-generated if blank"
              />
            </div>
            <div className="sm:col-span-2 sm:max-w-xs">
              <label className="uber-label block mb-1">Hourly rate ($)</label>
              <input
                type="number"
                min={0}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="uber-input w-full"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {msg && <p className="text-sm text-brand-primary">{msg}</p>}

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className="app-button-primary !w-auto !h-10 !px-5">
              {saving ? 'Adding…' : 'Create guard profile'}
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
