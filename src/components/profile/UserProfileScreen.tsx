import React, { useEffect, useState } from 'react';
import { Client, Certification, PlatformRole, SecurityGuard, SessionUser } from '../../types';
import { PREFAB_CERT_LIST } from '../../initialData';
import { certRequiresState, getVerifiedLicensedStates } from '../../lib/guardLicenses';
import { formatStateName, US_STATES } from '../../lib/states';
import { ROLE_LABELS } from '../../lib/permissions';
import { Award, LogOut, Plus, Save, User } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import type { ThemeMode } from '../../lib/platform/theme';

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
  onAddCertification?: (cert: Partial<Certification>) => void | Promise<void>;
}

export function UserProfileScreen({
  currentUser,
  themeMode,
  onChangeTheme,
  onSignOut,
  onSave,
  guard,
  client,
  onAddCertification,
}: UserProfileScreenProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddCert, setShowAddCert] = useState(false);
  const [addingCert, setAddingCert] = useState(false);
  const [certName, setCertName] = useState(PREFAB_CERT_LIST[0]);
  const [certIssuer, setCertIssuer] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [certIssueDate, setCertIssueDate] = useState('');
  const [certExpiryDate, setCertExpiryDate] = useState('');
  const [certState, setCertState] = useState('');
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
  const canManageCerts = currentUser.role === 'guard' && !!onAddCertification && !!guard;
  const licensedStates = guard ? getVerifiedLicensedStates(guard) : [];
  const certNeedsState = certRequiresState({ name: certName });

  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddCertification || !certIssuer.trim() || !certNumber.trim()) return;
    if (certNeedsState && !certState) return;
    setAddingCert(true);
    try {
      await onAddCertification({
        name: certName,
        issuer: certIssuer.trim(),
        number: certNumber.trim(),
        state: certNeedsState ? certState.toUpperCase() : undefined,
        issueDate: certIssueDate || new Date().toISOString().split('T')[0],
        expiryDate: certExpiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
      });
      setCertIssuer('');
      setCertNumber('');
      setCertState('');
      setCertIssueDate('');
      setCertExpiryDate('');
      setShowAddCert(false);
    } finally {
      setAddingCert(false);
    }
  };

  const certStatusClass = (status: Certification['status']) => {
    if (status === 'verified') return 'bg-brand-primary/10 text-brand-primary border-brand-primary/30';
    if (status === 'rejected') return 'bg-red-500/10 text-red-400 border-red-500/30';
    return 'bg-brand-border/30 text-brand-text-muted border-brand-border';
  };

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 py-6 max-w-lg mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col items-center text-center pt-2">
        <div className="w-20 h-20 rounded-full bg-brand-primary text-brand-accent-text flex items-center justify-center font-bold text-2xl mb-3 ring-4 ring-brand-primary/20">
          {initials}
        </div>
        <h1 className="text-xl font-bold">{name}</h1>
        <p className="text-sm text-brand-text-muted mt-1">{roleLabel}</p>
        <p className="text-xs text-brand-text-muted mt-0.5">{currentUser.email}</p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => (editing ? void handleSave() : setEditing(true))}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 uber-button-sage h-11 text-sm disabled:opacity-50"
        >
          {editing ? <Save className="w-4 h-4" /> : <User className="w-4 h-4" />}
          {editing ? (saving ? 'Saving…' : 'Save profile') : 'Edit profile'}
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-4 uber-button-outline h-11 text-sm"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="app-card space-y-4">
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
              <label className="uber-label">Bio</label>
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
          <div className="flex justify-between text-sm py-2 border-t border-brand-border">
            <span className="text-brand-text-muted">Verification</span>
            <span className={`font-medium ${guard.verified ? 'text-brand-primary' : 'text-amber-400'}`}>
              {guard.verified ? 'Verified' : 'Pending'}
            </span>
          </div>
        )}
        {client?.approved != null && (
          <div className="flex justify-between text-sm py-2 border-t border-brand-border">
            <span className="text-brand-text-muted">Account status</span>
            <span className={`font-medium ${client.approved ? 'text-brand-primary' : 'text-amber-400'}`}>
              {client.approved ? 'Approved' : 'Pending approval'}
            </span>
          </div>
        )}
      </div>

      {canManageCerts && guard && (
        <div className="staff-ops-card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="uber-label flex items-center gap-1.5">
              <Award className="w-4 h-4 text-brand-primary" />
              Certifications
            </p>
            <button
              type="button"
              onClick={() => setShowAddCert((v) => !v)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-primary text-brand-accent-text text-xs font-semibold"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>

          {!guard.verified && (
            <p className="text-[10px] font-mono text-amber-400 leading-relaxed">
              Add guard card licenses by state. You can only accept shifts in states where staff has verified your card.
            </p>
          )}

          {licensedStates.length > 0 && (
            <p className="text-[10px] font-mono text-emerald-400 leading-relaxed">
              Verified to work in: {licensedStates.map(formatStateName).join(', ')}
            </p>
          )}

          {showAddCert && (
            <form onSubmit={handleAddCert} className="space-y-3 pt-1 border-t border-brand-border">
              <div>
                <label className="text-[10px] font-mono uppercase text-brand-text-muted tracking-wide">Certification type</label>
                <select
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  className="uber-select w-full mt-1"
                >
                  {PREFAB_CERT_LIST.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {certNeedsState && (
                <div>
                  <label className="text-[10px] font-mono uppercase text-brand-text-muted tracking-wide">State</label>
                  <select
                    value={certState}
                    onChange={(e) => setCertState(e.target.value)}
                    required
                    className="uber-select w-full mt-1"
                  >
                    <option value="">Select state…</option>
                    {US_STATES.map(({ code, name }) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-brand-text-muted tracking-wide">Issuing body</label>
                  <input
                    type="text"
                    required
                    placeholder="State Licensing Dept"
                    value={certIssuer}
                    onChange={(e) => setCertIssuer(e.target.value)}
                    className="uber-input w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-brand-text-muted tracking-wide">License / card #</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. G-22109"
                    value={certNumber}
                    onChange={(e) => setCertNumber(e.target.value)}
                    className="uber-input w-full mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-brand-text-muted tracking-wide">Issue date</label>
                  <input type="date" value={certIssueDate} onChange={(e) => setCertIssueDate(e.target.value)} className="uber-input w-full mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-brand-text-muted tracking-wide">Expiry date</label>
                  <input type="date" value={certExpiryDate} onChange={(e) => setCertExpiryDate(e.target.value)} className="uber-input w-full mt-1" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddCert(false)} className="flex-1 py-2.5 rounded-xl border border-brand-border font-mono text-xs uppercase font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={addingCert} className="flex-1 py-2.5 rounded-xl bg-brand-primary text-black font-black text-xs uppercase disabled:opacity-50">
                  {addingCert ? 'Saving…' : 'Submit'}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {guard.certifications.length === 0 ? (
              <p className="text-xs font-mono text-brand-text-muted text-center py-4">No certifications yet.</p>
            ) : (
              guard.certifications.map((cert) => (
                <div key={cert.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-brand-border bg-black/20">
                  <div className="min-w-0">
                    <p className="font-black text-xs">{cert.name}</p>
                    <p className="text-[10px] font-mono text-brand-text-muted mt-1">
                      {cert.state ? `${formatStateName(cert.state)} · ` : ''}{cert.issuer} · #{cert.number}
                    </p>
                    {cert.expiryDate && (
                      <p className="text-[10px] font-mono text-brand-text-muted">Expires {cert.expiryDate}</p>
                    )}
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 text-[9px] font-mono uppercase font-black border rounded ${certStatusClass(cert.status)}`}>
                    {cert.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="app-card space-y-3">
        <p className="uber-label">Appearance</p>
        <ThemeToggle value={themeMode} onChange={onChangeTheme} className="w-full justify-center" />
      </div>

      <button
        type="button"
        onClick={onSignOut}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full border border-red-500/40 text-red-400 font-semibold text-sm hover:bg-red-500/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign out
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
      <label className="uber-label">{label}</label>
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
