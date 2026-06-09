import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

export interface StaffAddGuardInput {
  name: string;
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [hourlyRate, setHourlyRate] = useState('35');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setEmail('');
    setPhone('');
    setBadgeNumber('');
    setHourlyRate('35');
    setError('');
    setMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setSaving(true);
    try {
      const guardId = await onAdd({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        badgeNumber: badgeNumber.trim(),
        hourlyRate: parseInt(hourlyRate, 10) || 35,
      });
      setMsg(`${name.trim()} added. They can sign in with this email once auth is linked.`);
      reset();
      if (guardId) onCreated?.(guardId);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add guard.');
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
        Add guard
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
          <h3 className="text-sm font-semibold">Add field guard</h3>
          <p className="text-xs text-brand-text-muted mt-1">
            Creates a guard profile in the system. They still sign in separately with this email.
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="uber-label block mb-1">Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="uber-input w-full"
            placeholder="Jane Smith"
            required
          />
        </div>
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
