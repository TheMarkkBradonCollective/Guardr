import React, { useEffect, useState } from 'react';
import { Client, PlatformRole, SecurityGuard, SessionUser } from '../../types';
import { ROLE_LABELS } from '../../lib/permissions';
import { LogOut, Save, User } from 'lucide-react';

type ThemeMode = 'dark' | 'light' | 'grey';

const THEME_LABELS: Record<ThemeMode, string> = { dark: 'Dark', light: 'Light', grey: 'Grey' };

export interface ProfileSavePayload {
  name: string;
  phone: string;
  bio?: string;
  companyName?: string;
  hourlyRateRequirement?: number;
}

interface UserProfileScreenProps {
  currentUser: SessionUser;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onSignOut: () => void;
  onSave: (payload: ProfileSavePayload) => void | Promise<void>;
  guard?: SecurityGuard | null;
  client?: Client | null;
}

export function UserProfileScreen({
  currentUser,
  themeMode,
  onChangeTheme,
  onSignOut,
  onSave,
  guard,
  client,
}: UserProfileScreenProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(guard?.phone ?? client?.phone ?? '');
  const [bio, setBio] = useState(guard?.bio ?? '');
  const [companyName, setCompanyName] = useState(client?.companyName ?? currentUser.clientName ?? '');
  const [hourlyRate, setHourlyRate] = useState(String(guard?.hourlyRateRequirement ?? currentUser.hourlyRate ?? ''));

  useEffect(() => {
    setName(currentUser.name);
    setPhone(guard?.phone ?? client?.phone ?? '');
    setBio(guard?.bio ?? '');
    setCompanyName(client?.companyName ?? currentUser.clientName ?? '');
    setHourlyRate(String(guard?.hourlyRateRequirement ?? currentUser.hourlyRate ?? ''));
  }, [currentUser, guard, client]);

  const roleLabel = ROLE_LABELS[currentUser.role as PlatformRole] ?? currentUser.role;
  const initials = name.slice(0, 2).toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        companyName: companyName.trim(),
        hourlyRateRequirement: hourlyRate ? parseInt(hourlyRate, 10) : undefined,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const isGuardLike = currentUser.role === 'guard' || ['director', 'administrator', 'moderator'].includes(currentUser.role);
  const isClient = currentUser.role === 'client';

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 py-5 max-w-lg mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col items-center text-center pt-2">
        <div className="w-20 h-20 rounded-2xl bg-brand-primary text-black flex items-center justify-center font-black text-2xl font-mono mb-3">
          {initials}
        </div>
        <h1 className="text-xl font-black">{name}</h1>
        <p className="text-xs font-mono uppercase text-brand-text-muted mt-1">{roleLabel}</p>
        <p className="text-[11px] font-mono text-brand-text-muted mt-0.5">{currentUser.email}</p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => (editing ? void handleSave() : setEditing(true))}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-primary text-black font-black text-xs uppercase tracking-wider disabled:opacity-50"
        >
          {editing ? <Save className="w-4 h-4" /> : <User className="w-4 h-4" />}
          {editing ? (saving ? 'Saving…' : 'Save Profile') : 'Edit Profile'}
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-4 py-3 rounded-xl border border-brand-border font-mono text-xs uppercase font-bold"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="space-y-3">
        <Field label="Full name" value={name} onChange={setName} editing={editing} />
        {isClient && (
          <Field label="Company" value={companyName} onChange={setCompanyName} editing={editing} />
        )}
        <Field label="Phone" value={phone} onChange={setPhone} editing={editing} type="tel" />
        {isGuardLike && (
          <>
            <Field label="Badge" value={guard?.badgeNumber ?? currentUser.badgeNumber ?? '—'} editing={false} readOnly />
            {isGuardLike && currentUser.role === 'guard' && (
              <Field
                label="Hourly rate ($)"
                value={hourlyRate}
                onChange={setHourlyRate}
                editing={editing}
                type="number"
              />
            )}
            <div>
              <label className="text-[10px] font-mono uppercase text-brand-text-muted tracking-wide">Bio</label>
              {editing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="uber-input w-full mt-1 resize-none"
                />
              ) : (
                <p className="text-sm mt-1 text-brand-text-muted">{bio || 'No bio yet.'}</p>
              )}
            </div>
          </>
        )}
        {guard?.verified != null && (
          <div className="flex justify-between text-xs font-mono py-2 border-b border-brand-border">
            <span className="text-brand-text-muted uppercase">Verification</span>
            <span className={guard.verified ? 'text-emerald-400' : 'text-amber-400'}>
              {guard.verified ? 'Verified' : 'Pending'}
            </span>
          </div>
        )}
        {client?.approved != null && (
          <div className="flex justify-between text-xs font-mono py-2 border-b border-brand-border">
            <span className="text-brand-text-muted uppercase">Account status</span>
            <span className={client.approved ? 'text-emerald-400' : 'text-amber-400'}>
              {client.approved ? 'Approved' : 'Pending approval'}
            </span>
          </div>
        )}
      </div>

      <div className="staff-ops-card space-y-3">
        <p className="text-[10px] font-mono uppercase text-brand-text-muted tracking-wide">Appearance</p>
        <div className="flex border border-brand-border rounded-xl overflow-hidden text-[10px] font-mono">
          {(['dark', 'light', 'grey'] as ThemeMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChangeTheme(m)}
              className={`flex-1 py-2.5 font-bold uppercase ${
                themeMode === m ? 'bg-brand-primary text-black' : 'text-brand-text-muted'
              }`}
            >
              {THEME_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onSignOut}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-500/40 text-red-400 font-black text-xs uppercase tracking-wider hover:bg-red-500/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  editing,
  readOnly,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  editing: boolean;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase text-brand-text-muted tracking-wide">{label}</label>
      {editing && !readOnly && onChange ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="uber-input w-full mt-1"
        />
      ) : (
        <p className="text-sm font-medium mt-1">{value || '—'}</p>
      )}
    </div>
  );
}
