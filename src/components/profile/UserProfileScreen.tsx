import React, { useEffect, useState } from 'react';
import { Client, Certification, PlatformRole, SecurityGuard, SessionUser } from '../../types';
import { ROLE_LABELS } from '../../lib/permissions';
import { getGuardDisplayStatus, GUARD_STATUS_LABELS } from '../../lib/guardQualification';
import { Camera, LogOut, Save, User, X } from 'lucide-react';
import { ProfileAvatar } from './ProfileAvatar';
import { processProfilePhotoFile } from '../../lib/profilePhoto';
import { GuardResumeEditor, GuardResumeSavePayload } from './GuardResumeEditor';
import { Experience, GuardEducation } from '../../types';
import { ThemeToggle } from '../ui/ThemeToggle';
import type { ThemeMode } from '../../lib/platform/theme';
import { PushNotificationsPanel } from './PushNotificationsPanel';
import { AppFormSection, AppScreen } from '../ui/app/AppPrimitives';

export interface ProfileSavePayload extends Partial<GuardResumeSavePayload> {
  name: string;
  phone: string;
  bio?: string;
  companyName?: string;
  hourlyRateRequirement?: number;
  avatar?: string;
}

interface UserProfileScreenProps {
  currentUser: SessionUser;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onSignOut: () => void;
  onSave: (payload: ProfileSavePayload) => void | Promise<void>;
  guard?: SecurityGuard | null;
  client?: Client | null;
  onAddCertification?: (cert: Partial<Certification>) => Promise<import('../../lib/certUniqueness').AddCertificationResult>;
  onDeleteCertification?: (certId: string) => Promise<import('../../lib/certImagePolicy').CertImageMutationResult>;
  onAttachCertificationImage?: (
    certId: string,
    imageUrl: string
  ) => Promise<import('../../lib/certImagePolicy').CertImageMutationResult>;
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
  onAttachCertificationImage,
  onAddExperience,
  onAddEducation,
}: UserProfileScreenProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [avatar, setAvatar] = useState(guard?.avatar ?? client?.avatar ?? currentUser.avatar ?? '');
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
    setAvatar(guard?.avatar ?? client?.avatar ?? currentUser.avatar ?? '');
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

  const buildPayload = (avatarOverride?: string): ProfileSavePayload => ({
    name: name.trim(),
    phone: phone.trim(),
    companyName: companyName.trim(),
    hourlyRateRequirement: hourlyRate ? parseInt(hourlyRate, 10) : resume.hourlyRateRequirement,
    avatar: avatarOverride ?? avatar,
    ...resume,
    summary: resume.summary.trim(),
    about: resume.about.trim(),
    headline: resume.headline.trim(),
    bio: resume.summary.trim(),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(buildPayload());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoError('');
    setPhotoSaving(true);
    try {
      const dataUrl = await processProfilePhotoFile(file);
      setAvatar(dataUrl);
      await onSave(buildPayload(dataUrl));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not upload photo.');
    } finally {
      setPhotoSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoError('');
    setPhotoSaving(true);
    try {
      setAvatar('');
      await onSave(buildPayload(''));
    } catch {
      setPhotoError('Could not remove photo.');
    } finally {
      setPhotoSaving(false);
    }
  };

  const isGuardLike = currentUser.role === 'guard' || ['owner', 'director', 'administrator', 'moderator'].includes(currentUser.role);
  const isClient = currentUser.role === 'client';
  const canBuildResume = isGuardLike && !!guard;

  return (
    <AppScreen className="pb-8">
      <div className="flex flex-col items-center text-center px-5 pt-4 pb-6">
        <div className="relative mb-3">
          <ProfileAvatar src={avatar} name={name} size="xl" />
          <label
            className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-primary text-brand-accent-text flex items-center justify-center border-2 border-brand-bg ${
              photoSaving ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
            }`}
            title="Change profile photo"
          >
            <Camera className="w-4 h-4" />
            <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoSelect} disabled={photoSaving} />
          </label>
        </div>
        {photoError && <p className="text-xs text-red-500 mb-2">{photoError}</p>}
        {avatar && (
          <button
            type="button"
            onClick={() => void handleRemovePhoto()}
            disabled={photoSaving}
            className="text-xs text-brand-text-muted hover:text-red-500 flex items-center gap-1 mb-2 disabled:opacity-50"
          >
            <X className="w-3 h-3" />
            Remove photo
          </button>
        )}
        {photoSaving && <p className="text-xs text-brand-text-muted mb-2">Saving photo…</p>}
        <h2 className="text-xl font-bold">{name}</h2>
        <p className="text-sm text-brand-text-muted mt-1">{roleLabel}</p>
        <p className="text-xs text-brand-text-muted mt-0.5">{currentUser.email}</p>
      </div>

      <div className="px-5 flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => (editing ? void handleSave() : setEditing(true))}
          disabled={saving}
          className="flex-1 app-button-primary !h-11 !text-sm disabled:opacity-50"
        >
          {editing ? <Save className="w-4 h-4" /> : <User className="w-4 h-4" />}
          {editing ? (saving ? 'Saving…' : 'Save profile') : 'Edit profile'}
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="app-button-outline !w-auto !h-11 !px-4 !text-sm"
          >
            Cancel
          </button>
        )}
      </div>

      <AppFormSection className="space-y-4">
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
            <span className="font-medium">{GUARD_STATUS_LABELS[getGuardDisplayStatus(guard)]}</span>
          </div>
        )}
      </AppFormSection>

      {canBuildResume && guard && (
        <GuardResumeEditor
          guard={guard}
          editing={editing}
          payload={resume}
          onChange={(patch) => setResume((r) => ({ ...r, ...patch, hourlyRateRequirement: hourlyRate ? parseInt(hourlyRate, 10) : r.hourlyRateRequirement }))}
          onAddCertification={onAddCertification}
          onDeleteCertification={onDeleteCertification}
          onAttachCertificationImage={onAttachCertificationImage}
          onAddExperience={onAddExperience}
          onAddEducation={onAddEducation}
        />
      )}

      <PushNotificationsPanel currentUser={currentUser} />

      <AppFormSection>
        <p className="uber-label mb-3">Appearance</p>
        <ThemeToggle value={themeMode} onChange={onChangeTheme} className="w-full justify-center" />
      </AppFormSection>

      <div className="px-5 pt-4">
        <button
          type="button"
          onClick={onSignOut}
          className="w-full app-button-outline !text-red-500 !border-red-500/30 hover:!bg-red-500/5"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </AppScreen>
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
