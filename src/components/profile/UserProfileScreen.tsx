import React, { useEffect, useState } from 'react';
import { Client, ClientAuthorizedContact, Certification, GuardInsurancePolicy, PlatformRole, SecurityGuard, SessionUser } from '../../types';
import { isStaffRole, ROLE_LABELS } from '../../lib/permissions';
import { isStaffUserStatusActive } from '../../lib/accountStatus';
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
import { GuardInventoryPanel } from './GuardInventoryPanel';
import { syncLegacyGearFromInventory } from '../../lib/guardInventory';
import { Experience, GuardEducation } from '../../types';
import { AppFormSection, AppScreen, AppDashboardZone } from '../ui/app/AppPrimitives';
import { AppButton } from '../ui/AppButton';
import { ListFilterTabs } from '../ui/ListFilterTabs';
import type { GuardProfileTab, StaffProfileTab } from '../../lib/appNavigation';
import { GuardTimesheetPanel } from '../guard/GuardTimesheetPanel';
import { StaffTimesheetsPanel } from '../staff/StaffTimesheetsPanel';
import type { PlatformSettings } from '../../lib/platformSettings';
import type { SecurityRequest } from '../../types';
import { ResponsivePage, ResponsiveProfilePage } from '../layouts/desktop/DesktopPageShell';
import { useLayoutFormFactor } from '../../surfaces';
import { PersonNameFields } from './PersonNameFields';
import { formatPersonName, personNameFromPayload, resolvePersonNameParts } from '../../lib/personName';
import { StaffProfileSection, type StaffProfilePayload } from './StaffProfileSection';
import { getStaffDisplayHeadline } from '../../lib/staffProfile';
import {
  GuardIdentityVerificationPanel,
  type GuardIdentityVerificationPayload,
  type IdentityVerificationSubmitResult,
} from './GuardIdentityVerificationPanel';
import { AppNoticeChip } from '../ui/app/AppBlockedAccess';
import { normalizeClientType } from '../../lib/clientType';
import { ClientAuthorizedContactsSection } from '../client/ClientAuthorizedContactsSection';
import { ClientCredentialsSection } from '../client/ClientCredentialsSection';

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
  personalEmail?: string;
  authorizedContacts?: ClientAuthorizedContact[];
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
  requests?: SecurityRequest[];
  platformSettings?: PlatformSettings;
  onSubmitClientCredential?: (credential: import('../../types').ClientCredential) => void | Promise<void>;
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
  requests = [],
  platformSettings,
  onSubmitClientCredential,
}: UserProfileScreenProps) {
  const formFactor = useLayoutFormFactor();
  const [editing, setEditing] = useState(false);
  const [profileTab, setProfileTab] = useState<GuardProfileTab>('profile');
  const [staffProfileTab, setStaffProfileTab] = useState<StaffProfileTab>('profile');
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
  const [personalEmail, setPersonalEmail] = useState(guard?.personalEmail ?? '');
  const [bio, setBio] = useState(guard?.bio ?? '');
  const [staffProfile, setStaffProfile] = useState<StaffProfilePayload>({
    headline: guard?.headline ?? '',
    summary: guard?.summary ?? guard?.bio ?? '',
    about: guard?.about ?? '',
    specialties: guard?.specialties ?? [],
  });
  const [companyName, setCompanyName] = useState(client?.companyName ?? currentUser.clientName ?? '');
  const [authorizedContacts, setAuthorizedContacts] = useState<ClientAuthorizedContact[]>(
    client?.authorizedContacts ?? []
  );
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
    inventoryEquipment: guard?.inventoryEquipment ?? [],
    inventoryUniforms: guard?.inventoryUniforms ?? [],
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
    setPersonalEmail(guard?.personalEmail ?? '');
    setBio(guard?.bio ?? '');
    setStaffProfile({
      headline: guard?.headline ?? '',
      summary: guard?.summary ?? guard?.bio ?? '',
      about: guard?.about ?? '',
      specialties: guard?.specialties ?? [],
    });
    setCompanyName(client?.companyName ?? currentUser.clientName ?? '');
    setAuthorizedContacts(client?.authorizedContacts ?? []);
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
  const staffCanManageIdFromProfile = Boolean(
    isStaffAccount && guard && isStaffUserStatusActive(guard) && onSubmitIdentityVerification,
  );
  const isGuardAccount = currentUser.role === 'guard';
  const isClient = currentUser.role === 'client';
  const isPersonalClient = isClient && normalizeClientType(client?.clientType) === 'personal';

  const buildPayload = (avatarOverride?: string): ProfileSavePayload => {
    const normalized = personNameFromPayload({ firstName, middleName, lastName });
    const base: ProfileSavePayload = {
      ...normalized,
      phone: phone.trim(),
      avatar: avatarOverride ?? avatar,
    };
    if (isClient) {
      return { ...base, companyName: companyName.trim(), authorizedContacts };
    }
    if (isStaffAccount) {
      return {
        ...base,
        personalEmail: personalEmail.trim(),
        headline: staffProfile.headline.trim(),
        summary: staffProfile.summary.trim(),
        about: staffProfile.about.trim(),
        specialties: staffProfile.specialties,
        bio: staffProfile.summary.trim() || staffProfile.about.trim(),
      };
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
  const staffHeroSubtitle = isStaffAccount ? getStaffDisplayHeadline({
    headline: staffProfile.headline,
    staffRole: guard?.staffRole,
  }) : undefined;

  const profileSidebar = (
    <ProfileHero
      kicker={roleLabel}
      title={heroTitle}
      subtitle={
        isStaffAccount ? (
          <>
            <p className="text-sm text-brand-text-muted">{staffHeroSubtitle}</p>
            <p className="text-xs text-brand-text-muted mt-1">Staff ID: {staffBadgeId || '—'}</p>
          </>
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
              { id: 'inventory', label: 'Inventory' },
              { id: 'timesheet', label: 'Timesheet' },
            ]}
          />
        </div>
      )}
      {isStaffAccount && platformSettings && guard && (
        <div className="guard-profile-tabs mb-4">
          <ListFilterTabs
            aria-label="Staff profile"
            activeId={staffProfileTab}
            onChange={(id) => setStaffProfileTab(id as StaffProfileTab)}
            tabs={[
              { id: 'profile', label: 'Profile' },
              { id: 'timesheets', label: 'Timesheets' },
            ]}
          />
        </div>
      )}
      {profileTab === 'certs' && canBuildResume && guard ? (
        <section className="border-b border-brand-border space-y-6">
          <GuardCredentialsPanel
            guard={guard}
            editing={credentialsEditing}
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
      ) : profileTab === 'inventory' && canBuildResume && guard ? (
        <section className="border-b border-brand-border space-y-6">
          <GuardInventoryPanel
            guard={guard}
            editing={credentialsEditing || editing}
            equipment={resume.inventoryEquipment ?? guard.inventoryEquipment ?? []}
            uniforms={resume.inventoryUniforms ?? guard.inventoryUniforms ?? []}
            onEquipmentChange={async (inventoryEquipment) => {
              const inventoryUniforms = resume.inventoryUniforms ?? guard.inventoryUniforms ?? [];
              const legacy = syncLegacyGearFromInventory(guard, inventoryEquipment);
              setResume((r) => ({
                ...r,
                inventoryEquipment,
                listedWeaponGear: legacy.listedWeaponGear,
                listedEquipmentGear: legacy.listedEquipmentGear,
              }));
              await onSave({
                ...buildPayload(),
                inventoryEquipment,
                inventoryUniforms,
                listedWeaponGear: legacy.listedWeaponGear,
                listedEquipmentGear: legacy.listedEquipmentGear,
              });
            }}
            onUniformsChange={async (inventoryUniforms) => {
              const inventoryEquipment = resume.inventoryEquipment ?? guard.inventoryEquipment ?? [];
              const legacy = syncLegacyGearFromInventory(guard, inventoryEquipment);
              setResume((r) => ({ ...r, inventoryUniforms }));
              await onSave({
                ...buildPayload(),
                inventoryEquipment,
                inventoryUniforms,
                listedWeaponGear: legacy.listedWeaponGear,
                listedEquipmentGear: legacy.listedEquipmentGear,
              });
            }}
          />
        </section>
      ) : profileTab === 'timesheet' && canBuildResume && guard ? (
        <section className="border-b border-brand-border space-y-6">
          <GuardTimesheetPanel guardId={guard.id} requests={requests} />
        </section>
      ) : staffProfileTab === 'timesheets' && isStaffAccount && platformSettings && guard ? (
        <section className="border-b border-brand-border space-y-6">
          <StaffTimesheetsPanel staffId={guard.id} platformSettings={platformSettings} />
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
        {isClient && !isPersonalClient && (
          <Field
            label="Company"
            value={companyName}
            onChange={setCompanyName}
            editing={applicationFieldsEditable}
          />
        )}
        {isStaffAccount && (
          <>
            <Field
              label="Work email"
              value={guard?.email ?? currentUser.email}
              editing={false}
              readOnly
            />
            <Field
              label="Personal email"
              value={personalEmail}
              onChange={setPersonalEmail}
              editing={editing}
              type="email"
            />
          </>
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
        {isClient && client ? (
          <ClientAuthorizedContactsSection
            client={client}
            contacts={authorizedContacts}
            editing={editing}
            onChange={setAuthorizedContacts}
          />
        ) : null}
        {isClient && client ? (
          <ClientCredentialsSection
            client={client}
            rules={platformSettings?.clientCredentialRules}
            editing={editing}
            onSubmitCredential={onSubmitClientCredential}
          />
        ) : null}
        {isStaffAccount && (
          <StaffProfileSection
            member={{
              ...staffProfile,
              staffRole: guard?.staffRole,
              bio: guard?.bio,
            }}
            editing={editing}
            payload={staffProfile}
            onChange={(patch) => setStaffProfile((current) => ({ ...current, ...patch }))}
            className="pt-2"
          />
        )}
        {staffCanManageIdFromProfile && guard ? (
          <AppDashboardZone title="Government ID">
            <p className="text-xs text-brand-text-muted mb-3 leading-relaxed">
              Upload or update your government-issued ID. Submissions go to the credentials queue for
              Director review.
            </p>
            <GuardIdentityVerificationPanel
              guard={guard}
              onSubmit={onSubmitIdentityVerification!}
              compact
            />
          </AppDashboardZone>
        ) : null}
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

  if (formFactor !== 'mobile') {
    return (
      <ResponsiveProfilePage sidebar={profileSidebar}>
        <div className={formFactor === 'desktop' ? 'adm-profile-sections' : 'sft-profile-sections'}>{profileBody}</div>
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
