import React, { useEffect, useMemo, useState } from 'react';
import { Certification, Experience, GuardEducation, SecurityGuard, SecurityRequest } from '../../types';
import { certDisplayName } from '../../lib/certCatalog';
import { groupGuardCertsByCategory } from '../../lib/certMatching';
import {
  getGuardDisplayStatus,
  getQualificationProgress,
  GUARD_STATUS_LABELS,
  guardPathwayStatusLabel,
} from '../../lib/guardQualification';
import { CertBadgeRow } from '../guard/CertBadgeRow';
import { CertItemCard } from '../credentials/CertItemCard';
import { GuardCredentialsPanel } from '../profile/GuardCredentialsPanel';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { JobListCard } from '../jobs/JobListCard';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { ArrowLeft, Camera, Check, Save, User, X } from 'lucide-react';
import { GuardResumeEditor, GuardResumeSavePayload } from '../profile/GuardResumeEditor';
import { ProfileSavePayload } from '../profile/UserProfileScreen';
import { processProfilePhotoFile } from '../../lib/profilePhoto';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import { PersonNameFields } from '../profile/PersonNameFields';
import { formatPersonName, personNameFromPayload, resolvePersonNameParts } from '../../lib/personName';
import { getGuardUserStatus, GUARD_USER_STATUS_LABELS } from '../../lib/accountStatus';
import { StaffIdReviewSection } from './StaffIdReviewSection';
import { promptStaffResubmitNote } from '../../lib/staffDocumentReview';
import { GuardActivationChecklistView } from '../guard/GuardActivationChecklistView';
import {
  getGuardActivationChecklist,
  guardCanActivateAccount,
} from '../../lib/guardAccountActivation';
import { GUARD_TRUSTED_BADGE_LABEL, isGuardTrusted } from '../../lib/guardTrust';

interface StaffGuardDetailPanelProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
  canManage: boolean;
  canSuspend: boolean;
  onUpdateUserStatus: (id: string, status: 'active' | 'suspended' | 'blocked') => void;
  onResetAuditFailures?: (id: string) => void;
  onApproveCert: (guardId: string, certId: string) => void;
  onRejectCert: (guardId: string, certId: string) => void;
  onUpdateBackgroundChecked?: (guardId: string, checked: boolean) => void;
  onUpdateProfile?: (payload: ProfileSavePayload) => void | Promise<void>;
  onAddCertification?: (cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onDeleteCertification?: (certId: string) => Promise<CertImageMutationResult>;
  onAttachCertificationImage?: (certId: string, imageUrl: string) => Promise<CertImageMutationResult>;
  onUpdateCertification?: (
    certId: string,
    payload: import('../credentials/CertDetailModal').CertUpdatePayload
  ) => Promise<import('../credentials/CertDetailModal').CertUpdateResult>;
  onAddExperience?: (exp: Omit<Experience, 'id'>) => void | Promise<void>;
  onAddEducation?: (edu: Omit<GuardEducation, 'id'>) => void | Promise<void>;
  onApproveGuardAccount?: (guardId: string) => void | Promise<void>;
  onDeleteGuard?: (guardId: string) => void | Promise<void>;
  onSubmitIdentityVerification?: (
    payload: import('../profile/GuardIdentityVerificationPanel').GuardIdentityVerificationPayload
  ) => Promise<import('../profile/GuardIdentityVerificationPanel').IdentityVerificationSubmitResult>;
  onApproveIdentityVerification?: (guardId: string) => void | Promise<void>;
  onRejectIdentityVerification?: (guardId: string, reason?: string) => void | Promise<void>;
  onRequestIdentityResubmit?: (
    guardId: string,
    slots: import('../../lib/staffDocumentReview').IdVerificationSlot[],
    staffNote?: string
  ) => void | Promise<void>;
  onUpdateGuardIdImages?: (
    guardId: string,
    payload: import('../profile/GuardIdentityVerificationPanel').GuardIdentityVerificationPayload
  ) => Promise<import('../profile/GuardIdentityVerificationPanel').IdentityVerificationSubmitResult>;
  onRequestCertImageResubmit?: (guardId: string, certId: string, staffNote?: string) => void | Promise<void>;
  onBack?: () => void;
  onOpenJob?: (jobId: string) => void;
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  compact?: boolean;
}

export function StaffGuardDetailPanel({
  guard,
  requests,
  canManage,
  canSuspend,
  onUpdateUserStatus,
  onResetAuditFailures,
  onApproveCert,
  onRejectCert,
  onUpdateBackgroundChecked,
  onUpdateProfile,
  onAddCertification,
  onDeleteCertification,
  onAttachCertificationImage,
  onUpdateCertification,
  onAddExperience,
  onAddEducation,
  onApproveGuardAccount,
  onDeleteGuard,
  onSubmitIdentityVerification,
  onApproveIdentityVerification,
  onRejectIdentityVerification,
  onRequestIdentityResubmit,
  onUpdateGuardIdImages,
  onRequestCertImageResubmit,
  onBack,
  onOpenJob,
  editing: controlledEditing,
  onEditingChange,
  compact = false,
}: StaffGuardDetailPanelProps) {
  const canEdit = canManage && !!onUpdateProfile;
  const [internalEditing, setInternalEditing] = useState(false);
  const editing = controlledEditing ?? internalEditing;
  const setEditing = (next: boolean) => {
    if (controlledEditing === undefined) setInternalEditing(next);
    onEditingChange?.(next);
  };
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const initialName = resolvePersonNameParts(guard);
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [middleName, setMiddleName] = useState(initialName.middleName ?? '');
  const [lastName, setLastName] = useState(initialName.lastName);
  const [phone, setPhone] = useState(guard.phone ?? '');
  const [badgeNumber, setBadgeNumber] = useState(guard.badgeNumber);
  const [hourlyRate, setHourlyRate] = useState(String(guard.hourlyRateRequirement ?? ''));
  const [avatar, setAvatar] = useState(guard.avatar ?? '');
  const [resume, setResume] = useState<GuardResumeSavePayload>({
    headline: guard.headline ?? '',
    summary: guard.summary ?? guard.bio ?? '',
    about: guard.about ?? '',
    skills: guard.skills ?? [],
    languages: guard.languages ?? [],
    serviceAreas: guard.serviceAreas ?? [],
    specialties: guard.specialties ?? [],
    yearsExperience: guard.yearsExperience,
    availabilityNotes: guard.availabilityNotes ?? '',
    hourlyRateRequirement: guard.hourlyRateRequirement,
  });

  useEffect(() => {
    const resolved = resolvePersonNameParts(guard);
    setFirstName(resolved.firstName);
    setMiddleName(resolved.middleName ?? '');
    setLastName(resolved.lastName);
    setPhone(guard.phone ?? '');
    setBadgeNumber(guard.badgeNumber);
    setHourlyRate(String(guard.hourlyRateRequirement ?? ''));
    setAvatar(guard.avatar ?? '');
    setResume({
      headline: guard.headline ?? '',
      summary: guard.summary ?? guard.bio ?? '',
      about: guard.about ?? '',
      skills: guard.skills ?? [],
      languages: guard.languages ?? [],
      serviceAreas: guard.serviceAreas ?? [],
      specialties: guard.specialties ?? [],
      yearsExperience: guard.yearsExperience,
      availabilityNotes: guard.availabilityNotes ?? '',
      hourlyRateRequirement: guard.hourlyRateRequirement,
    });
  }, [guard]);

  const guardAccountStatus = getGuardUserStatus(guard);
  const pathwayStatus = getGuardDisplayStatus(guard);
  const progress = getQualificationProgress(guard);
  const activationChecklist = getGuardActivationChecklist(guard);
  const groupedCerts = useMemo(() => groupGuardCertsByCategory(guard), [guard]);

  const guardJobs = useMemo(
    () =>
      requests
        .filter((r) => r.assignedGuardId === guard.id)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        .slice(0, 8),
    [requests, guard.id]
  );

  const allCerts = useMemo(() => {
    const flat: Certification[] = (Object.values(groupedCerts) as Certification[][]).flat();
    return flat
      .filter((c) => c.status !== 'rejected')
      .sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return a.name.localeCompare(b.name);
      });
  }, [groupedCerts]);

  const displayName = formatPersonName({ firstName, middleName, lastName });

  const buildPayload = (avatarOverride?: string): ProfileSavePayload => {
    const normalized = personNameFromPayload({ firstName, middleName, lastName });
    return {
      ...normalized,
      phone: phone.trim(),
      badgeNumber: badgeNumber.trim(),
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
    if (!onUpdateProfile) return;
    setSaving(true);
    setSaveError('');
    try {
      await onUpdateProfile(buildPayload());
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGuard = async () => {
    if (!onDeleteGuard) return;
    if (!window.confirm(`Delete guard account for ${guard.name}? This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      await onDeleteGuard(guard.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete guard account.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelEdit = () => {
    const resolved = resolvePersonNameParts(guard);
    setFirstName(resolved.firstName);
    setMiddleName(resolved.middleName ?? '');
    setLastName(resolved.lastName);
    setPhone(guard.phone ?? '');
    setBadgeNumber(guard.badgeNumber);
    setHourlyRate(String(guard.hourlyRateRequirement ?? ''));
    setAvatar(guard.avatar ?? '');
    setResume({
      headline: guard.headline ?? '',
      summary: guard.summary ?? guard.bio ?? '',
      about: guard.about ?? '',
      skills: guard.skills ?? [],
      languages: guard.languages ?? [],
      serviceAreas: guard.serviceAreas ?? [],
      specialties: guard.specialties ?? [],
      yearsExperience: guard.yearsExperience,
      availabilityNotes: guard.availabilityNotes ?? '',
      hourlyRateRequirement: guard.hourlyRateRequirement,
    });
    setPhotoError('');
    setSaveError('');
    setEditing(false);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUpdateProfile) return;
    setPhotoError('');
    setPhotoSaving(true);
    try {
      const dataUrl = await processProfilePhotoFile(file);
      setAvatar(dataUrl);
      await onUpdateProfile(buildPayload(dataUrl));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not upload photo.');
    } finally {
      setPhotoSaving(false);
    }
  };

  const requestCertResubmit = (cert: Certification) => {
    if (!onRequestCertImageResubmit) return;
    const note = promptStaffResubmitNote(`${certDisplayName(cert)} photo`);
    if (note === null) return;
    void onRequestCertImageResubmit(guard.id, cert.id, note);
  };

  const renderStaffCertActions = (cert: Certification) =>
    canManage && cert.status === 'pending' ? (
      <div className="flex gap-1.5 justify-end flex-wrap">
        {cert.imageUrl && onRequestCertImageResubmit && (
          <button
            type="button"
            onClick={() => requestCertResubmit(cert)}
            className="app-button-outline !w-auto !h-8 !px-3 !text-xs gap-1"
          >
            Request clearer photo
          </button>
        )}
        <button
          type="button"
          onClick={() => onRejectCert(guard.id, cert.id)}
          className="app-button-outline !w-auto !h-8 !px-3 !text-xs text-red-400 border-red-500/40 gap-1"
        >
          <X className="w-3 h-3" /> Reject
        </button>
        <button
          type="button"
          onClick={() => onApproveCert(guard.id, cert.id)}
          className="app-button-primary !w-auto !h-8 !px-3 !text-xs gap-1"
        >
          <Check className="w-3 h-3" /> Verify
        </button>
      </div>
    ) : null;

  const renderPendingCertActions = () => {
    const pendingCerts = allCerts.filter((c) => c.status === 'pending');
    if (pendingCerts.length === 0) return null;

    return (
      <section className="py-4 border-b border-brand-border space-y-3">
        <WfSectionHeader title="Pending credentials" count={pendingCerts.length} className="mb-0" />
        <div className="app-cert-item-stack">
          {pendingCerts.map((cert) => (
            <div key={cert.id} className="space-y-2">
              <CertItemCard
                cert={cert}
                guardName={guard.name}
                canEdit={canManage}
                staffMode={canManage}
                onUpdate={onUpdateCertification ? (payload) => onUpdateCertification(cert.id, payload) : undefined}
              />
              {renderStaffCertActions(cert)}
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className={`staff-detail-pane ${compact ? '' : 'h-full overflow-y-auto'}`}>
      {(onBack || (canEdit && !guard.isStaff)) && (
        <div className="staff-detail-toolbar">
          {onBack ? (
            <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-brand-primary">
              <ArrowLeft className="w-4 h-4" />
              Back to list
            </button>
          ) : (
            <span />
          )}
          {canEdit && !guard.isStaff && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => (editing ? void handleSave() : setEditing(true))}
                disabled={saving}
                className="app-button-primary !w-auto !h-9 !px-4 !text-xs gap-1.5 disabled:opacity-50"
              >
                {editing ? <Save className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                {editing ? (saving ? 'Saving…' : 'Save profile') : 'Edit profile'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="app-button-outline !w-auto !h-9 !px-4 !text-xs"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="staff-detail-header">
        <div className="relative shrink-0">
          <ProfileAvatar src={editing ? avatar : guard.avatar} name={displayName} size="lg" rounded="xl" />
          {editing && canEdit && (
            <label
              className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-primary text-brand-accent-text flex items-center justify-center border-2 border-brand-bg ${
                photoSaving ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
              }`}
              title="Change profile photo"
            >
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoSelect} disabled={photoSaving} />
            </label>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {editing ? (
              <div className="w-full">
                <PersonNameFields
                  firstName={firstName}
                  middleName={middleName}
                  lastName={lastName}
                  onFirstNameChange={setFirstName}
                  onMiddleNameChange={setMiddleName}
                  onLastNameChange={setLastName}
                  editing
                />
              </div>
            ) : (
              <h2 className="font-bold text-lg">{guard.name}</h2>
            )}
            {guard.isStaff && (
              <WfBadge tone="primary">{guard.staffRole || 'Staff'}</WfBadge>
            )}
          </div>
          <p className="text-sm text-brand-text-muted mt-1">{guard.email}</p>
          {saveError && <p className="text-xs text-red-500 mt-1">{saveError}</p>}
          {photoError && <p className="text-xs text-red-500 mt-1">{photoError}</p>}
          {photoSaving && <p className="text-xs text-brand-text-muted mt-1">Saving photo…</p>}
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <EditField label="Badge number" value={badgeNumber} onChange={setBadgeNumber} />
              <EditField label="Phone" value={phone} onChange={setPhone} type="tel" />
              <EditField label="Min hourly rate ($)" value={hourlyRate} onChange={setHourlyRate} type="number" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-x-4 gap-y-3 mt-3">
              <div>
                <p className="wf-metric-label">Badge</p>
                <p className="wf-metric-value">{guard.badgeNumber}</p>
              </div>
              <div>
                <p className="wf-metric-label">Rating</p>
                <p className="wf-metric-value text-brand-primary">★ {guard.rating}</p>
              </div>
              <div>
                <p className="wf-metric-label">Jobs</p>
                <p className="wf-metric-value">{guard.jobsCompleted}</p>
              </div>
            </div>
          )}
          {!guard.isStaff && (
            <div className="flex flex-wrap gap-2 mt-3">
              <WfBadge tone="primary">{GUARD_STATUS_LABELS[pathwayStatus]}</WfBadge>
              <WfBadge tone={guardAccountStatus === 'pending' ? 'warning' : guardAccountStatus === 'active' ? 'success' : 'danger'}>
                Account: {GUARD_USER_STATUS_LABELS[guardAccountStatus]}
              </WfBadge>
              {isGuardTrusted(guard) && (
                <WfBadge tone="success">{GUARD_TRUSTED_BADGE_LABEL}</WfBadge>
              )}
              {guard.backgroundChecked && (
                <WfBadge tone="primary">Background checked</WfBadge>
              )}
            </div>
          )}
        </div>
      </div>

      {!guard.isStaff && (
        <>
          {canManage && (
          <section className="staff-detail-section space-y-3">
            <WfSectionHeader title="Account controls" className="!px-0 !mb-0" />
            <div className="staff-detail-actions">
              {guardAccountStatus === 'pending' && onApproveGuardAccount && (
                <button
                  type="button"
                  onClick={() => {
                    void (async () => {
                      try {
                        await onApproveGuardAccount(guard.id);
                      } catch (err) {
                        alert(err instanceof Error ? err.message : 'Could not approve profile.');
                      }
                    })();
                  }}
                  disabled={!guardCanActivateAccount(guard)}
                  className="app-button-primary !w-auto !h-9 !px-4 !text-xs disabled:opacity-50"
                  title={
                    activationChecklist.blockers.length > 0
                      ? activationChecklist.blockers.join(' · ')
                      : 'Approve guard profile'
                  }
                >
                  Approve guard profile
                </button>
              )}
              {canSuspend && guardAccountStatus === 'pending' && onDeleteGuard && (
                <button
                  type="button"
                  onClick={() => void handleDeleteGuard()}
                  disabled={deleting}
                  className="app-button-outline !w-auto !h-9 !px-4 !text-xs text-red-400 border-red-500/40"
                >
                  {deleting ? 'Deleting…' : 'Delete account'}
                </button>
              )}
              {canSuspend && guardAccountStatus !== 'suspended' && guardAccountStatus === 'active' && (
                <button type="button" onClick={() => onUpdateUserStatus(guard.id, 'suspended')} className="app-button-outline !w-auto !h-9 !px-4 !text-xs">
                  Suspend
                </button>
              )}
              {canSuspend && guardAccountStatus !== 'blocked' && guardAccountStatus === 'active' && (
                <button type="button" onClick={() => onUpdateUserStatus(guard.id, 'blocked')} className="app-button-outline !w-auto !h-9 !px-4 !text-xs text-red-400 border-red-500/40">
                  Flag / Block
                </button>
              )}
              {canSuspend && guardAccountStatus !== 'active' && guardAccountStatus !== 'pending' && (
                <button type="button" onClick={() => onUpdateUserStatus(guard.id, 'active')} className="app-button-primary !w-auto !h-9 !px-4 !text-xs">
                  Restore account
                </button>
              )}
              {(guard.failedAudits ?? 0) > 0 && onResetAuditFailures && (
                <button type="button" onClick={() => onResetAuditFailures(guard.id)} className="app-button-outline !w-auto !h-9 !px-4 !text-xs">
                  Clear violations ({guard.failedAudits}/3)
                </button>
              )}
              {onUpdateBackgroundChecked && (
                <button
                  type="button"
                  onClick={() => onUpdateBackgroundChecked(guard.id, !guard.backgroundChecked)}
                  className="app-button-outline !w-auto !h-9 !px-4 !text-xs"
                >
                  {guard.backgroundChecked ? 'Clear background check' : 'Mark background checked'}
                </button>
              )}
              {onDeleteGuard && guardAccountStatus !== 'pending' && (
                <button
                  type="button"
                  onClick={() => void handleDeleteGuard()}
                  disabled={deleting}
                  className="app-button-outline !w-auto !h-9 !px-4 !text-xs text-red-400 border-red-500/40"
                >
                  {deleting ? 'Deleting…' : 'Delete account'}
                </button>
              )}
            </div>
          </section>
          )}

          {!editing && (
            <section className="staff-detail-section space-y-2">
              <WfSectionHeader title="Qualification" className="!px-0 !mb-0" />
              <p className="text-sm">
                Pathway: <strong>{guardPathwayStatusLabel(progress.level)}</strong>
              </p>
              <CertBadgeRow guard={guard} showCaBaseline />
            </section>
          )}

          {editing && canEdit && (
            <section className="staff-detail-section">
              <GuardResumeEditor
                guard={guard}
                editing
                staffMode={canManage}
                payload={resume}
                onChange={(patch) =>
                  setResume((r) => ({
                    ...r,
                    ...patch,
                    hourlyRateRequirement: hourlyRate ? parseInt(hourlyRate, 10) : r.hourlyRateRequirement,
                  }))
                }
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

          {editing ? renderPendingCertActions() : (
            <section className="staff-detail-section space-y-3">
              {!guard.isStaff && guardAccountStatus === 'pending' && (
                <GuardActivationChecklistView guard={guard} compact />
              )}
              <GuardCredentialsPanel
                guard={guard}
                editing={false}
                staffMode={canManage}
                onSubmitIdentityVerification={onUpdateGuardIdImages}
                onUpdateCertification={onUpdateCertification}
                staffIdReview={
                  canManage ? (
                    <StaffIdReviewSection
                      guard={guard}
                      canManage={canManage}
                      onApprove={onApproveIdentityVerification}
                      onReject={onRejectIdentityVerification}
                      onRequestResubmit={
                        onRequestIdentityResubmit
                          ? (guardId, slots, staffNote) => onRequestIdentityResubmit(guardId, slots, staffNote)
                          : undefined
                      }
                    />
                  ) : undefined
                }
                renderCertActions={renderStaffCertActions}
              />
            </section>
          )}

          <section className="staff-detail-section space-y-2">
            <WfSectionHeader title="Recent jobs" className="!px-0 !mb-0" />
            {guardJobs.length === 0 ? (
              <p className="text-sm text-brand-text-muted">No jobs on record.</p>
            ) : (
              <AppItemCardStack>
                {guardJobs.map((job) => (
                  <JobListCard
                    key={job.id}
                    job={job}
                    subtitle={`${job.clientName} · ${job.status.replace('-', ' ')}`}
                    onClick={onOpenJob ? () => onOpenJob(job.id) : undefined}
                  />
                ))}
              </AppItemCardStack>
            )}
          </section>
        </>
      )}

      {guard.isStaff && (
        <section className="staff-detail-section">
          <p className="text-sm text-brand-text-muted">
            Staff platform account — field credential verification does not apply.
          </p>
          {guard.phone && <p className="text-sm mt-2">{guard.phone}</p>}
        </section>
      )}

      {guard.bio && !guard.isStaff && !editing && (
        <section className="staff-detail-section">
          <WfSectionHeader title="Bio" className="!px-0 !mb-2" />
          <p className="text-sm text-brand-text-muted leading-relaxed">{guard.bio}</p>
        </section>
      )}
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="wf-metric-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="uber-input w-full mt-1 text-sm"
      />
    </div>
  );
}
