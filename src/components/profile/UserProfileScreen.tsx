import React, { useEffect, useState } from 'react';
import { Client, Certification, PlatformRole, SecurityGuard, SessionUser } from '../../types';
import { ROLE_LABELS } from '../../lib/permissions';
import { getGuardDisplayStatus, GUARD_STATUS_LABELS } from '../../lib/guardQualification';
import { LogOut, Save, User } from 'lucide-react';
import { GuardResumeEditor, GuardResumeSavePayload } from './GuardResumeEditor';
import { Experience, GuardEducation } from '../../types';
import { ThemeToggle } from '../ui/ThemeToggle';
import type { ThemeMode } from '../../lib/platform/theme';
import { PushNotificationsPanel } from './PushNotificationsPanel';

export interface ProfileSavePayload extends Partial<GuardResumeSavePayload> {
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
  onDeleteCertification?: (certId: string) => void | Promise<void>;
  onAddExperience?: (exp: Omit<Experience, 'id'>) => void | Promise<void>;
  onAddEducation?: (edu: Omit<GuardEducation, 'id'>) => void | Promise<void>;
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
  onDeleteCertification,
  onAddExperience,
  onAddEducation,
}: UserProfileScreenProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(guard?.phone ?? client?.phone ?? '');
  const [companyName, setCompanyName] = useState(client?.companyName ?? currentUser.clientName ?? '');
  const [hourlyRate, setHourlyRate] = useState(String(guard?.hourlyRateRequirement ?? currentUser.hourlyRate ?? ''));
  const [resume, setResume] = useState<GuardResumeSavePayload>({
    headline: guard?.headline ?? '',
    summary: guard?.summary ?? guard?.bio ?? '',
    about: guard?.about ?? '',
    skills: guard?.skills ?? [],
    languages: guard?.languages ?? [],
    serviceAreas: guard?.serviceAreas ?? [],
    specialties: guard?.specialties ?? [],
    yearsExperience: guard?.yearsExperience,
    availabilityNotes: guard?.availabilityNotes ?? '',
    hourlyRateRequirement: guard?.hourlyRateRequirement,
  });

  useEffect(() => {
    setName(currentUser.name);
    setPhone(guard?.phone ?? client?.phone ?? '');
    setCompanyName(client?.companyName ?? currentUser.clientName ?? '');
    setHourlyRate(String(guard?.hourlyRateRequirement ?? currentUser.hourlyRate ?? ''));
    setResume({
      headline: guard?.headline ?? '',
      summary: guard?.summary ?? guard?.bio ?? '',
      about: guard?.about ?? '',
      skills: guard?.skills ?? [],
      languages: guard?.languages ?? [],
      serviceAreas: guard?.serviceAreas ?? [],
      specialties: guard?.specialties ?? [],
      yearsExperience: guard?.yearsExperience,
      availabilityNotes: guard?.availabilityNotes ?? '',
      hourlyRateRequirement: guard?.hourlyRateRequirement,
    });
  }, [currentUser, guard, client]);

  const roleLabel = ROLE_LABELS[currentUser.role as PlatformRole] ?? currentUser.role;
  const initials = name.slice(0, 2).toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim(),
        companyName: companyName.trim(),
        hourlyRateRequirement: hourlyRate ? parseInt(hourlyRate, 10) : resume.hourlyRateRequirement,
        ...resume,
        summary: resume.summary.trim(),
        about: resume.about.trim(),
        headline: resume.headline.trim(),
        bio: resume.summary.trim(),
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const isGuardLike = currentUser.role === 'guard' || ['director', 'administrator', 'moderator'].includes(currentUser.role);
  const isClient = currentUser.role === 'client';
  const canBuildResume = isGuardLike && !!guard;

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
          <Field
            label="Minimum hourly rate ($)"
            value={hourlyRate}
            onChange={setHourlyRate}
            editing={editing}
            type="number"
          />
        )}
        {guard && (
          <div className="flex justify-between text-sm py-2 border-t border-brand-border">
            <span className="text-brand-text-muted">Guard status</span>
            <span className="font-medium text-brand-primary">
              {GUARD_STATUS_LABELS[getGuardDisplayStatus(guard)]}
            </span>
          </div>
        )}
      </div>

      {canBuildResume && guard && (
        <GuardResumeEditor
          guard={guard}
          editing={editing}
          payload={resume}
          onChange={(patch) => setResume((r) => ({ ...r, ...patch, hourlyRateRequirement: hourlyRate ? parseInt(hourlyRate, 10) : r.hourlyRateRequirement }))}
          onAddCertification={onAddCertification}
          onDeleteCertification={onDeleteCertification}
          onAddExperience={onAddExperience}
          onAddEducation={onAddEducation}
        />
      )}

      <PushNotificationsPanel currentUser={currentUser} />

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
