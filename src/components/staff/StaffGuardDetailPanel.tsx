import React, { useEffect, useMemo, useState } from 'react';
import { Certification, Experience, GuardEducation, SecurityGuard, SecurityRequest } from '../../types';
import { groupGuardCertsByCategory } from '../../lib/certMatching';
import {
  getGuardDisplayStatus,
  getQualificationProgress,
  GUARD_STATUS_LABELS,
  guardPathwayStatusLabel,
} from '../../lib/guardQualification';
import { CertBadgeRow } from '../guard/CertBadgeRow';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { CertItemCard } from '../credentials/CertItemCard';
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
import { GuardIdentityVerificationPanel } from '../profile/GuardIdentityVerificationPanel';
import {
  getGuardIdVerificationStatus,
  ID_VERIFICATION_STATUS_LABELS,
} from '../../lib/guardIdentityVerification';
import { GuardActivationChecklistView } from '../guard/GuardActivationChecklistView';
import {
  getGuardActivationChecklist,
  guardCanActivateAccount,
} from '../../lib/guardAccountActivation';

interface StaffGuardDetailPanelProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
  canManage: boolean;
  canSuspend: boolean;
  onUpdateUserStatus: (id: string, status: 'active' | 'suspended' | 'blocked') => void;
  onResetAuditFailures?: (id: string) => void;
  onApproveCert: (guardId: string, certId: string) => void;
  onRejectCert: (guardId: string, certId: string) => void;
  onApproveGuard?: (guardId: string) => void;
  onRejectGuard?: (guardId: string) => void;
  onUpdateBackgroundChecked?: (guardId: string, checked: boolean) => void;
  onUpdateProfile?: (payload: ProfileSavePayload) => void | Promise<void>;
  onAddCertification?: (cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onDeleteCertification?: (certId: string) => Promise<CertImageMutationResult>;
  onAttachCertificationImage?: (certId: string, imageUrl: string) => Promise<CertImageMutationResult>;
  onAddExperience?: (exp: Omit<Experience, 'id'>) => void | Promise<void>;
  onAddEducation?: (edu: Omit<GuardEducation, 'id'>) => void | Promise<void>;
  onApproveGuardAccount?: (guardId: string) => void | Promise<void>;
  onDeleteGuard?: (guardId: string) => void | Promise<void>;
  onSubmitIdentityVerification?: (
    payload: import('../profile/GuardIdentityVerificationPanel').GuardIdentityVerificationPayload
  ) => Promise<import('../profile/GuardIdentityVerificationPanel').IdentityVerificationSubmitResult>;
  onApproveIdentityVerification?: (guardId: string) => void | Promise<void>;
  onRejectIdentityVerification?: (guardId: string, reason?: string) => void | Promise<void>;
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
  onApproveGuard,
  onRejectGuard,
  onUpdateBackgroundChecked,
  onUpdateProfile,
  onAddCertification,
  onDeleteCertification,
  onAttachCertificationImage,
  onAddExperience,
  onAddEducation,
  onApproveGuardAccount,
  onDeleteGuard,
  onSubmitIdentityVerification,
  onApproveIdentityVerification,
  onRejectIdentityVerification,
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
  const idVerificationStatus = getGuardIdVerificationStatus(guard);
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

  const pendingCount = allCerts.filter((c) => c.status === 'pending').length;

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

  const renderPendingCertActions = () => {
    const pendingCerts = allCerts.filter((c) => c.status === 'pending');
    if (pendingCerts.length === 0) return null;

    return (
      <section className="py-4 border-b border-brand-border space-y-3">
        <WfSectionHeader title="Pending credentials" count={pendingCerts.length} className="mb-0" />
        <div className="app-cert-item-stack">
          {pendingCerts.map((cert) => (
            <div key={cert.id} className="space-y-2">
              <CertItemCard cert={cert} guardName={guard.name} />
              {canManage && (
                <div className="flex gap-1.5 justify-end">
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
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className={`staff-detail-pane space-y-0 ${compact ? '' : 'h-full overflow-y-auto'}`}>
      {(onBack || (canEdit && !guard.isStaff)) && (
        <div className="px-1 pb-4 flex items-center justify-between gap-3">
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

      <div className="flex items-start gap-4 pb-5 border-b border-brand-border">
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
              {guard.verified && (
                <WfBadge tone="success">Guardr verified</WfBadge>
              )}
              {guard.backgroundChecked && (
                <WfBadge tone="primary">Background checked</WfBadge>
              )}
              {idVerificationStatus === 'verified' && (
                <WfBadge tone="success">{ID_VERIFICATION_STATUS_LABELS.verified}</WfBadge>
              )}
              {idVerificationStatus === 'pending' && (
                <WfBadge tone="warning">{ID_VERIFICATION_STATUS_LABELS.pending}</WfBadge>
              )}
            </div>
          )}
        </div>
      </div>

      {!guard.isStaff && guardAccountStatus === 'pending' && (
        <div className="px-1 pb-4">
          <GuardActivationChecklistView guard={guard} />
        </div>
      )}

      {!guard.isStaff && (
        <>
          {!editing && (
            <section className="py-4 border-b border-brand-border space-y-2">
              <WfSectionHeader title="Qualification" className="mb-0" />
              <p className="text-sm">
                Pathway: <strong>{guardPathwayStatusLabel(progress.level)}</strong>
              </p>
              <CertBadgeRow guard={guard} showCaBaseline />
            </section>
          )}

          {canManage && (
          <section className="py-4 border-b border-brand-border space-y-2">
            <WfSectionHeader title="Account controls" className="mb-0" />
            <div className="flex flex-wrap gap-2">
              {guardAccountStatus === 'pending' && onApproveGuardAccount && (
                <button
                  type="button"
                  onClick={() => {
                    void (async () => {
                      try {
                        await onApproveGuardAccount(guard.id);
                      } catch (err) {
                        alert(err instanceof Error ? err.message : 'Could not activate account.');
                      }
                    })();
                  }}
                  disabled={!guardCanActivateAccount(guard)}
                  className="app-button-primary !w-auto !h-9 !px-4 !text-xs disabled:opacity-50"
                  title={
                    activationChecklist.blockers.length > 0
                      ? activationChecklist.blockers.join(' · ')
                      : 'Activate guard account'
                  }
                >
                  Activate guard account
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
              {onApproveGuard && !guard.verified && (
                <button type="button" onClick={() => onApproveGuard(guard.id)} className="app-button-primary !w-auto !h-9 !px-4 !text-xs">
                  Verify guard profile
                </button>
              )}
              {onRejectGuard && guard.verified && (
                <button type="button" onClick={() => onRejectGuard(guard.id)} className="app-button-outline !w-auto !h-9 !px-4 !text-xs">
                  Remove profile verification
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

          {!editing && onSubmitIdentityVerification && (
            <GuardIdentityVerificationPanel
              guard={guard}
              onSubmit={onSubmitIdentityVerification}
              compact
            />
          )}

          {canManage && idVerificationStatus === 'pending' && (
            <section className="py-4 border-b border-brand-border space-y-2">
              <WfSectionHeader title="ID verification review" className="mb-0" />
              <div className="flex flex-wrap gap-2">
                {onApproveIdentityVerification && (
                  <button
                    type="button"
                    onClick={() => onApproveIdentityVerification(guard.id)}
                    className="app-button-primary !w-auto !h-9 !px-4 !text-xs gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve ID
                  </button>
                )}
                {onRejectIdentityVerification && (
                  <button
                    type="button"
                    onClick={() => {
                      const reason = window.prompt('Rejection reason (shown to guard):');
                      if (reason === null) return;
                      void onRejectIdentityVerification(guard.id, reason);
                    }}
                    className="app-button-outline !w-auto !h-9 !px-4 !text-xs text-red-400 border-red-500/40 gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Reject ID
                  </button>
                )}
              </div>
            </section>
          )}

          {editing && canEdit && (
            <div className="py-4 border-b border-brand-border">
              <GuardResumeEditor
                guard={guard}
                editing
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
                onAddExperience={onAddExperience}
                onAddEducation={onAddEducation}
                onSubmitIdentityVerification={onSubmitIdentityVerification}
                identityVerificationCompact
              />
            </div>
          )}

          {editing ? renderPendingCertActions() : (
            <section className="py-4 border-b border-brand-border space-y-3">
              <WfSectionHeader
                title="Credentials"
                count={pendingCount > 0 ? pendingCount : undefined}
                className="mb-0"
              />
              {allCerts.length === 0 ? (
                <p className="text-sm text-brand-text-muted">No credentials on file.</p>
              ) : (
                <div className="app-cert-item-stack">
                  {allCerts.map((cert) => (
                    <div key={cert.id} className="space-y-2">
                      <CertItemCard cert={cert} guardName={guard.name} />
                      {canManage && cert.status === 'pending' && (
                        <div className="flex gap-1.5 justify-end">
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
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="py-4 border-b border-brand-border space-y-2">
            <WfSectionHeader title="Recent jobs" className="mb-0" />
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
        <section className="py-4 border-b border-brand-border">
          <p className="text-sm text-brand-text-muted">
            Staff platform account — field credential verification does not apply.
          </p>
          {guard.phone && <p className="text-sm mt-2">{guard.phone}</p>}
        </section>
      )}

      {guard.bio && !guard.isStaff && !editing && (
        <section className="py-4">
          <WfSectionHeader title="Bio" className="mb-2" />
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
