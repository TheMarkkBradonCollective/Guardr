import React, { useEffect, useState } from 'react';
import { Client, Certification, GuardInsurancePolicy, PlatformRole, SecurityGuard, SessionUser } from '../../types';
import { isStaffRole, ROLE_LABELS } from '../../lib/permissions';
import { getGuardDisplayStatus, GUARD_STATUS_LABELS } from '../../lib/guardQualification';
import { GuardArmedStatusPill } from '../guard/GuardArmedStatusPill';
import { isGuardAccountPreActive } from '../../lib/accountStatus';
import {
  GUARD_APPLICATION_INTAKE_LOCKED_MESSAGE,
  CLIENT_APPLICATION_INTAKE_LOCKED_MESSAGE,
  isClientApplicationContactLocked,
  isGuardApplicationIntakeLocked,
  isGuardApplicationRevisionOpen,
  isClientApplicationRevisionOpen,
} from '../../lib/applicationIntakeLock';
import { Camera, Save, User, X } from 'lucide-react';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileHero } from './ProfileHero';
import { processProfilePhotoFile } from '../../lib/profilePhoto';
import { GuardResumeEditor, GuardResumeSavePayload } from './GuardResumeEditor';
import { GuardCredentialsPanel } from './GuardCredentialsPanel';
import { Experience, GuardEducation } from '../../types';
import { AppFormSection, AppScreen, AppDashboardZone } from '../ui/app/AppPrimitives';
import { AppButton } from '../ui/AppButton';
import { ListFilterTabs } from '../ui/ListFilterTabs';
import type { GuardProfileTab } from '../../lib/appNavigation';
import { ResponsivePage, ResponsiveProfilePage } from '../layouts/desktop/DesktopPageShell';
import { useDevice } from '../../lib/platform';
import { PersonNameFields } from './PersonNameFields';
import { formatPersonName, personNameFromPayload, resolvePersonNameParts } from '../../lib/personName';
import {
  type GuardIdentityVerificationPayload,
  type IdentityVerificationSubmitResult,
} from './GuardIdentityVerificationPanel';
import { AppNoticeChip } from '../ui/app/AppBlockedAccess';

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
  onSaveInsurance?: (
    policy: Partial<GuardInsurancePolicy> & { guardId: string }
  ) => Promise<void>;
  onSaveVehicleInsurance?: (
    policy: Partial<import('../../types').GuardVehicleInsurancePolicy> & { guardId: string }
  ) => Promise<void>;
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
  onSaveInsurance,
  onSaveVehicleInsurance,
}: UserProfileScreenProps) {
  const { formFactor } = useDevice();
  const [editing, setEditing] = useState(false);
  const [profileTab, setProfileTab] = useState<GuardProfileTab>('profile');
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
  const [bio, setBio] = useState(guard?.bio ?? '');
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
    listedWeaponGear: guard?.listedWeaponGear ?? [],
    listedEquipmentGear: guard?.listedEquipmentGear ?? [],
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
    setBio(guard?.bio ?? '');
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
      listedWeaponGear: guard?.listedWeaponGear ?? [],
      listedEquipmentGear: guard?.listedEquipmentGear ?? [],
    });
  }, [currentUser, guard, client]);

  const roleLabel = ROLE_LABELS[currentUser.role as PlatformRole] ?? currentUser.role;
  const displayName = formatPersonName({ firstName, middleName, lastName });

  const isStaffAccount = isStaffRole(currentUser.role);
  const isGuardAccount = currentUser.role === 'guard';
  const isClient = currentUser.role === 'client';

  const buildPayload = (avatarOverride?: string): ProfileSavePayload => {
    const normalized = personNameFromPayload({ firstName, middleName, lastName });
    const base: ProfileSavePayload = {
      ...normalized,
      phone: phone.trim(),
      avatar: avatarOverride ?? avatar,
    };
    if (isClient) {
      return { ...base, companyName: companyName.trim() };
    }
    if (isStaffAccount) {
      return { ...base, bio: bio.trim() };
    }
    if (isGuardAccount) {
      return {
        ...base,
        hourlyRateRequirement: hourlyRate
          ? Math.max(0, parseInt(hourlyRate, 10) || 0)
          : resume.hourlyRateRequirement,
        ...resume,
        summary: resume.summary.trim(),
        about: resume.about.trim(),
        headline: resume.headline.trim(),
        bio: resume.summary.trim(),
      };
    }
    return base;
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

  const canBuildResume = isGuardAccount && !!guard && !guard.isStaff;
  const credentialsEditing = editing || !!(guard && isGuardAccountPreActive(guard));
  const guardIntakeLocked = Boolean(guard && !guard.isStaff && isGuardApplicationIntakeLocked(guard));
  const clientContactLocked = Boolean(client && isClientApplicationContactLocked(client));
  const applicationFieldsEditable =
    editing &&
    ((isGuardAccount && !guardIntakeLocked) || (isClient && !clientContactLocked) || isStaffAccount);
  const revisionOpen = Boolean(
    (guard && isGuardApplicationRevisionOpen(guard)) ||
      (client && isClientApplicationRevisionOpen(client))
  );
  const staffBadgeId = guard?.badgeNumber ?? currentUser.badgeNumber ?? '';
  const heroTitle = isStaffAccount && !displayName.trim() ? staffBadgeId || '—' : displayName;

  const profileSidebar = (
    <ProfileHero
      kicker={roleLabel}
      title={heroTitle}
      subtitle={
        isStaffAccount ? (
          <p className="text-sm text-brand-text-muted">Staff ID: {staffBadgeId || '—'}</p>
        ) : undefined
      }
      email={currentUser.email}
      avatar={<ProfileAvatar src={avatar} name={heroTitle} size="xl" />}
      photoControls={
        <>
          <label
            className={`absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-brand-primary text-brand-accent-text flex items-center justify-center border-2 border-brand-bg shadow-lg ${
              photoSaving ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:opacity-90 transition-opacity'
            }`}
            title="Change profile photo"
          >
            <Camera className="w-4 h-4" />
            <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoSelect} disabled={photoSaving} />
          </label>
          {photoError && <p className="text-xs text-red-500 mt-2">{photoError}</p>}
          {avatar && !photoSaving && (
            <button
              type="button"
              onClick={() => void handleRemovePhoto()}
              disabled={photoSaving}
              className="mt-2 text-xs text-brand-text-muted hover:text-red-500 flex items-center gap-1 disabled:opacity-50 transition-colors"
            >
              <X className="w-3 h-3" />
              Remove photo
            </button>
          )}
          {photoSaving && <p className="text-xs text-brand-text-muted mt-2">Saving photo…</p>}
        </>
      }
    />
  );

  const profileBody = (
    <>
      {canBuildResume && guard && (
        <div className="guard-profile-tabs mb-4">
          <ListFilterTabs
            aria-label="Guard profile"
            activeId={profileTab}
            onChange={(id) => setProfileTab(id as GuardProfileTab)}
            tabs={[
              { id: 'profile', label: 'Profile' },
              { id: 'certs', label: 'Credentials' },
            ]}
          />
        </div>
      )}
      {profileTab === 'certs' && canBuildResume && guard ? (
        <section className="border-b border-brand-border space-y-6">
          <GuardCredentialsPanel
            guard={guard}
            editing={credentialsEditing}
            weaponGearEditing={credentialsEditing}
            equipmentGearEditing={editing}
            weaponGearSelected={resume.listedWeaponGear ?? guard.listedWeaponGear ?? []}
            equipmentGearSelected={resume.listedEquipmentGear ?? guard.listedEquipmentGear ?? []}
            onWeaponGearChange={(listedWeaponGear) =>
              setResume((r) => ({ ...r, listedWeaponGear }))
            }
            onEquipmentGearChange={(listedEquipmentGear) =>
              setResume((r) => ({ ...r, listedEquipmentGear }))
            }
            onAddCertification={onAddCertification}
            onDeleteCertification={onDeleteCertification}
            onAttachCertificationImage={onAttachCertificationImage}
            onUpdateCertification={onUpdateCertification}
            onSubmitIdentityVerification={onSubmitIdentityVerification}
            onSaveInsurance={onSaveInsurance}
            onSaveVehicleInsurance={onSaveVehicleInsurance}
            certOverlayNav={!editing ? { onEditFullPage: () => setEditing(true) } : undefined}
          />
        </section>
      ) : (
        <>
      {(guardIntakeLocked || clientContactLocked) && (
        <AppNoticeChip
          className="mb-4"
          tone="warning"
          label="Application details locked"
          title="Application locked"
          message={
            isClient ? CLIENT_APPLICATION_INTAKE_LOCKED_MESSAGE : GUARD_APPLICATION_INTAKE_LOCKED_MESSAGE
          }
        />
      )}
      {revisionOpen && (
        <AppNoticeChip
          className="mb-4"
          tone="warning"
          label="Staff requested application updates"
          title="Revision requested"
          message={
            guard?.applicationRevisionNote?.trim() ||
            client?.applicationRevisionNote?.trim() ||
            'Update the application details below and save. They lock again after you save.'
          }
        />
      )}
      <AppDashboardZone title="Contact & account">
        <div className="staff-detail-actions mb-4">
          <AppButton
            type="button"
            variant="primary"
            size="sm"
            onClick={() => (editing ? void handleSave() : setEditing(true))}
            disabled={saving}
            startEnhancer={editing ? <Save className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
          >
            {editing ? (saving ? 'Saving…' : 'Save profile') : 'Edit profile'}
          </AppButton>
          {editing && (
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(false)}
            >
              Cancel
            </AppButton>
          )}
        </div>
        <PersonNameFields
          firstName={firstName}
          middleName={middleName}
          lastName={lastName}
          onFirstNameChange={setFirstName}
          onMiddleNameChange={setMiddleName}
          onLastNameChange={setLastName}
          editing={applicationFieldsEditable}
        />
        {isClient && (
          <Field
            label="Company"
            value={companyName}
            onChange={setCompanyName}
            editing={applicationFieldsEditable}
          />
        )}
        {isStaffAccount && (
          <Field label="Staff ID" value={staffBadgeId} editing={false} readOnly />
        )}
        <Field
          label="Phone"
          value={phone}
          onChange={setPhone}
          editing={applicationFieldsEditable}
          type="tel"
        />
        {isStaffAccount && (
          <BioField label="Bio / notes" value={bio} onChange={setBio} editing={editing} />
        )}
        {isGuardAccount && (
          <Field
            label="Minimum hourly rate ($)"
            value={hourlyRate}
            onChange={setHourlyRate}
            editing={applicationFieldsEditable}
            type="number"
            min={0}
          />
        )}
        {isGuardAccount && guard && (
          <>
            <div className="flex justify-between text-sm py-2 border-t border-brand-border">
              <span className="text-brand-text-muted">Account status</span>
              <span className="font-medium">{GUARD_STATUS_LABELS[getGuardDisplayStatus(guard)]}</span>
            </div>
            <div className="flex justify-between items-center text-sm py-2 border-t border-brand-border">
              <span className="text-brand-text-muted">Carry status</span>
              <GuardArmedStatusPill guard={guard} />
            </div>
          </>
        )}
      </AppDashboardZone>

      {canBuildResume && guard && (
        <section className="border-b border-brand-border">
          <GuardResumeEditor
          guard={guard}
          editing={editing}
          credentialsEditing={credentialsEditing}
          applicationIntakeEditing={applicationFieldsEditable}
          payload={resume}
          onChange={(patch) => setResume((r) => ({ ...r, ...patch, hourlyRateRequirement: hourlyRate ? Math.max(0, parseInt(hourlyRate, 10) || 0) : r.hourlyRateRequirement }))}
          onAddCertification={onAddCertification}
          onDeleteCertification={onDeleteCertification}
          onAttachCertificationImage={onAttachCertificationImage}
          onUpdateCertification={onUpdateCertification}
          onAddExperience={onAddExperience}
          onAddEducation={onAddEducation}
          onSubmitIdentityVerification={onSubmitIdentityVerification}
          onSaveInsurance={onSaveInsurance}
          onSaveVehicleInsurance={onSaveVehicleInsurance}
          onEditCredentialFullPage={!editing ? () => setEditing(true) : undefined}
          hideCredentials
          hideGear
        />
        </section>
      )}
        </>
      )}
    </>
  );

  if (formFactor === 'desktop') {
    return (
      <ResponsiveProfilePage sidebar={profileSidebar}>
        <div className="adm-profile-sections">{profileBody}</div>
      </ResponsiveProfilePage>
    );
  }

  return (
    <AppScreen className="app-profile-screen">
      {profileSidebar}
      {profileBody}
    </AppScreen>
  );
}

function BioField({
  label,
  value,
  onChange,
  editing,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
}) {
  return (
    <div>
      <label className="uber-label">{label}</label>
      {editing ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="uber-input w-full mt-1 resize-y min-h-[5rem]"
        />
      ) : (
        <p className="text-sm font-medium mt-1 whitespace-pre-wrap">{value || '—'}</p>
      )}
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
  min,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  editing: boolean;
  readOnly?: boolean;
  type?: string;
  min?: number;
}) {
  return (
    <div>
      <label className="uber-label">{label}</label>
      {editing && !readOnly && onChange ? (
        <input
          type={type}
          min={min}
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
