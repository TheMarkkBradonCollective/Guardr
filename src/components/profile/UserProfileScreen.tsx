import React, { useEffect, useState } from 'react';
import { Client, Certification, PlatformRole, SecurityGuard, SessionUser } from '../../types';
import { ROLE_LABELS } from '../../lib/permissions';
import { getGuardDisplayStatus, GUARD_STATUS_LABELS } from '../../lib/guardQualification';
import { isGuardAccountPreActive } from '../../lib/accountStatus';
import { Camera, Save, User, X } from 'lucide-react';
import { ProfileAvatar } from './ProfileAvatar';
import { processProfilePhotoFile } from '../../lib/profilePhoto';
import { GuardResumeEditor, GuardResumeSavePayload } from './GuardResumeEditor';
import { Experience, GuardEducation } from '../../types';
import { PushNotificationsPanel } from './PushNotificationsPanel';
import { AppFormSection, AppScreen } from '../ui/app/AppPrimitives';
import { LegalInfoCards } from '../legal/LegalInfoCards';
import type { LegalPageId } from '../../lib/legalContent';
import { LEGAL_DISCLAIMER_SHORT } from '../../lib/legalContent';
import { PersonNameFields } from './PersonNameFields';
import { formatPersonName, personNameFromPayload, resolvePersonNameParts } from '../../lib/personName';
import {
  type GuardIdentityVerificationPayload,
  type IdentityVerificationSubmitResult,
} from './GuardIdentityVerificationPanel';

export interface ProfileSavePayload extends Partial<GuardResumeSavePayload> {
  name: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phone: string;
  bio?: string;
  companyName?: string;
  hourlyRateRequirement?: number;
  avatar?: string;
  badgeNumber?: string;
}

interface UserProfileScreenProps {
  currentUser: SessionUser;
  onSave: (payload: ProfileSavePayload) => void | Promise<void>;
  guard?: SecurityGuard | null;
  client?: Client | null;
  onAddCertification?: (cert: Partial<Certification>) => Promise<import('../../lib/certUniqueness').AddCertificationResult>;
  onDeleteCertification?: (certId: string) => Promise<import('../../lib/certImagePolicy').CertImageMutationResult>;
  onAttachCertificationImage?: (
    certId: string,
    imageUrl: string
  ) => Promise<import('../../lib/certImagePolicy').CertImageMutationResult>;
  onUpdateCertification?: (
    certId: string,
    payload: import('../credentials/CertDetailModal').CertUpdatePayload
  ) => Promise<import('../credentials/CertDetailModal').CertUpdateResult>;
  onAddExperience?: (exp: Omit<Experience, 'id'>) => void | Promise<void>;
  onAddEducation?: (edu: Omit<GuardEducation, 'id'>) => void | Promise<void>;
  onSubmitIdentityVerification?: (
    payload: GuardIdentityVerificationPayload
  ) => Promise<IdentityVerificationSubmitResult>;
  isDbConnected?: boolean;
  onOpenLegal?: (page: LegalPageId) => void;
}

export function UserProfileScreen({
  currentUser,
  onSave,
  guard,
  client,
  onAddCertification,
  onDeleteCertification,
  onAttachCertificationImage,
  onUpdateCertification,
  onAddExperience,
  onAddEducation,
  onSubmitIdentityVerification,
  isDbConnected = false,
  onOpenLegal,
}: UserProfileScreenProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const profileSource = guard ?? client;
  const initialName = resolvePersonNameParts({
    firstName: profileSource?.firstName,
    middleName: profileSource?.middleName,
    lastName: profileSource?.lastName,
    name: currentUser.name,
  });
  const [avatar, setAvatar] = useState(guard?.avatar ?? client?.avatar ?? currentUser.avatar ?? '');
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [middleName, setMiddleName] = useState(initialName.middleName ?? '');
  const [lastName, setLastName] = useState(initialName.lastName);
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
    const resolved = resolvePersonNameParts({
      firstName: profileSource?.firstName,
      middleName: profileSource?.middleName,
      lastName: profileSource?.lastName,
      name: currentUser.name,
    });
    setAvatar(guard?.avatar ?? client?.avatar ?? currentUser.avatar ?? '');
    setFirstName(resolved.firstName);
    setMiddleName(resolved.middleName ?? '');
    setLastName(resolved.lastName);
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
  const displayName = formatPersonName({ firstName, middleName, lastName });

  const buildPayload = (avatarOverride?: string): ProfileSavePayload => {
    const normalized = personNameFromPayload({ firstName, middleName, lastName });
    return {
      ...normalized,
      phone: phone.trim(),
    companyName: companyName.trim(),
    hourlyRateRequirement: hourlyRate ? parseInt(hourlyRate, 10) : resume.hourlyRateRequirement,
    avatar: avatarOverride ?? avatar,
    ...resume,
    summary: resume.summary.trim(),
    about: resume.about.trim(),
    headline: resume.headline.trim(),
    bio: resume.summary.trim(),
    };
  };

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
  const credentialsEditing = editing || !!(guard && isGuardAccountPreActive(guard));

  return (
    <AppScreen>
      <section className="flex flex-col items-center text-center px-5 pt-5 pb-6 border-b border-brand-border">
        <div className="relative mb-3">
          <ProfileAvatar src={avatar} name={displayName} size="xl" />
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
        <h2 className="text-xl font-bold">{displayName}</h2>
        <p className="text-sm text-brand-text-muted mt-1">{roleLabel}</p>
        <p className="text-xs text-brand-text-muted mt-0.5">{currentUser.email}</p>
      </section>

      <div className="px-5 py-4 flex gap-2 border-b border-brand-border">
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

      <AppFormSection title="Contact & account">
        <PersonNameFields
          firstName={firstName}
          middleName={middleName}
          lastName={lastName}
          onFirstNameChange={setFirstName}
          onMiddleNameChange={setMiddleName}
          onLastNameChange={setLastName}
          editing={editing}
        />
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
        <section className="border-b border-brand-border">
          <GuardResumeEditor
          guard={guard}
          editing={editing}
          credentialsEditing={credentialsEditing}
          payload={resume}
          onChange={(patch) => setResume((r) => ({ ...r, ...patch, hourlyRateRequirement: hourlyRate ? parseInt(hourlyRate, 10) : r.hourlyRateRequirement }))}
          onAddCertification={onAddCertification}
          onDeleteCertification={onDeleteCertification}
          onAttachCertificationImage={onAttachCertificationImage}
          onUpdateCertification={onUpdateCertification}
          onAddExperience={onAddExperience}
          onAddEducation={onAddEducation}
          onSubmitIdentityVerification={onSubmitIdentityVerification}
        />
        </section>
      )}

      <section className="border-b border-brand-border">
        <PushNotificationsPanel currentUser={currentUser} isDbConnected={isDbConnected} />
      </section>

      {onOpenLegal && (
        <AppFormSection title="Legal">
          <p className="text-xs text-brand-text-muted leading-relaxed mb-4 -mt-2">{LEGAL_DISCLAIMER_SHORT}</p>
          <LegalInfoCards onOpenLegal={onOpenLegal} />
        </AppFormSection>
      )}
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
