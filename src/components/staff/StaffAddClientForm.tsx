import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { STAFF_PROVISIONED_DEFAULT_PASSWORD } from '../../lib/accountPasswords';
import { PersonNameFields } from '../profile/PersonNameFields';
import { personNameFromPayload } from '../../lib/personName';
import { AppFormSheet } from '../ui/app/AppFormSheet';

export interface StaffAddClientInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  companyName: string;
  phone: string;
}

interface StaffAddClientFormProps {
  onAdd: (input: StaffAddClientInput) => Promise<string | void>;
  onCreated?: (clientId: string) => void;
}

export function StaffAddClientForm({ onAdd, onCreated }: StaffAddClientFormProps) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setEmail('');
    setCompanyName('');
    setPhone('');
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
      const clientId = await onAdd({
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        email: email.trim(),
        companyName: companyName.trim(),
        phone: phone.trim(),
      });
      const displayName = personNameFromPayload({
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
      }).name;
      setMsg(
        `${companyName.trim() || displayName} added. Default sign-in password: ${STAFF_PROVISIONED_DEFAULT_PASSWORD}.`
      );
      reset();
      if (clientId) onCreated?.(clientId);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add client.');
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
        Add client
      </button>

      <AppFormSheet
        open={open}
        onClose={closeForm}
        title="Add client account"
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
                placeholder="client@company.com"
                required
              />
            </div>
            <div>
              <label className="uber-label block mb-1">Company / site name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="uber-input w-full"
                placeholder="Optional — shows on job posts"
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
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {msg && <p className="text-sm text-brand-primary">{msg}</p>}

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className="app-button-primary !w-auto !h-10 !px-5">
              {saving ? 'Adding…' : 'Create client account'}
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
