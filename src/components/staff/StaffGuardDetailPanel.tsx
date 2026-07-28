import { showAppToast } from '../ui/AppToast';
import { jobAffectedByTrustedRevocation } from '../../lib/guardTeamFlow';
import { showAppConfirm } from '../ui/AppConfirm';
import {
  confirmApproveGuardProfile,
  confirmBackgroundCheckToggle,
  confirmBlockAccount,
  confirmClearAuditViolations,
  confirmMarkGuardTrusted,
  confirmRemoveGuardTrusted,
  confirmRestoreAccount,
  confirmSuspendAccount,
} from '../../lib/importantActionConfirm';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Certification,
  Experience,
  GuardEducation,
  GuardStandingCrewMember,
  SecurityGuard,
  SecurityRequest,
} from '../../types';
import {
  getActiveStandingCrewMembers,
  getPendingStandingCrewOutgoing,
  guardLeadsOwnStandingCrew,
} from '../../lib/guardStandingCrew';
import { staffMakeCrewLeadBlocker } from '../../lib/staffGuardEligibility';
import { certDisplayName } from '../../lib/certCatalog';
import { groupGuardCertsByCategory } from '../../lib/certMatching';
import {
  getQualificationProgress,
  guardPathwayStatusLabel,
} from '../../lib/guardQualification';
import { CertBadgeRow } from '../guard/CertBadgeRow';
import { CertItemCard } from '../credentials/CertItemCard';
import { GuardCredentialsPanel } from '../profile/GuardCredentialsPanel';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { JobListCard } from '../jobs/JobListCard';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { AppButton } from '../ui/AppButton';
import { ArrowLeft, Camera, Check, Save, User, Users, X } from 'lucide-react';
import { StaffListFilterTabs } from './StaffListFilterTabs';
import type { StaffGuardDetailTab } from '../../lib/appNavigation';
import type { PerformanceFactorId } from '../../lib/guardPerformanceFactorDetail';
import { StaffGuardPerformancePanel } from './StaffGuardPerformancePanel';
import { GuardResumeEditor, GuardResumeSavePayload } from '../profile/GuardResumeEditor';
import { GuardArmedStatusPill } from '../guard/GuardArmedStatusPill';
import { ProfileSavePayload } from '../profile/UserProfileScreen';
import { processProfilePhotoFile } from '../../lib/profilePhoto';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import { staffCanVerifyCertification, staffVerifyCertificationBlocker } from '../../lib/certImagePolicy';
import { PersonNameFields } from '../profile/PersonNameFields';
import { formatPersonName, personNameFromPayload, resolvePersonNameParts } from '../../lib/personName';
import { getGuardUserStatus } from '../../lib/accountStatus';
import { StaffIdReviewSection } from './StaffIdReviewSection';
import { StaffVehicleReviewSection } from './StaffVehicleReviewSection';
import { promptStaffResubmitNote } from '../../lib/staffDocumentReview';
import {
  getGuardActivationChecklist,
  guardCanStaffApproveProfile,
} from '../../lib/guardAccountActivation';
import { GuardRosterStatusBadges } from './GuardRosterStatusBadges';
import { govIdApprovalItemId } from '../../lib/guardCredentialSections';
import type { CertOverlayNavigation } from '../credentials/credentialOverlayNavigation';

interface StaffGuardDetailPanelProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
  standingCrewMembers?: GuardStandingCrewMember[];
  canManage: boolean;
  canVerifyCredentials?: boolean;
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
  onRejectGuardApplication?: (guardId: string, reason?: string) => void | Promise<void>;
  onSetGuardTrusted?: (trusted: boolean) => void | Promise<void>;
  onMakeCrewLead?: () => void | Promise<void>;
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
  onReviewInsurance?: (status: 'verified' | 'rejected', rejectionReason?: string) => void | Promise<void>;
  onApproveVehicle?: (guardId: string) => void | Promise<void>;
  onRejectVehicle?: (guardId: string, reason?: string) => void | Promise<void>;
  onBack?: () => void;
  onOpenJob?: (jobId: string) => void;
  onOpenGuardApplication?: (guardId: string) => void;
  onOpenGuardCredential?: (guardId: string, credentialItemId: string) => void;
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  staffGuardTab?: StaffGuardDetailTab;
  onStaffGuardTabChange?: (tab: StaffGuardDetailTab) => void;
  performanceFactorId?: PerformanceFactorId | null;
  onPerformanceFactorChange?: (factorId: PerformanceFactorId | null) => void;
  compact?: boolean;
}

export function StaffGuardDetailPanel({
  guard,
  requests,
  standingCrewMembers = [],
  canManage,
  canVerifyCredentials = false,
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
  onSetGuardTrusted,
  onMakeCrewLead,
  onDeleteGuard,
  onSubmitIdentityVerification,
  onApproveIdentityVerification,
  onRequestIdentityResubmit,
  onUpdateGuardIdImages,
  onRequestCertImageResubmit,
  onReviewInsurance,
  onApproveVehicle,
  onRejectVehicle,
  onBack,
  onOpenJob,
  onOpenGuardApplication,
  onOpenGuardCredential,
  editing: controlledEditing,
  onEditingChange,
  staffGuardTab = 'profile',
  onStaffGuardTabChange,
  performanceFactorId = null,
  onPerformanceFactorChange,
  compact = false,
}: StaffGuardDetailPanelProps) {
  const canEdit = canManage && !!onUpdateProfile;
  const [internalEditing, setInternalEditing] = useState(false);
  const editing = controlledEditing ?? internalEditing;
  const setEditing = (next: boolean) => {
    if (controlledEditing === undefined) setInternalEditing(next);
    onEditingChange?.(next);
  };

  const certOverlayNav = useMemo((): CertOverlayNavigation | undefined => {
    if (!onOpenGuardCredential && !canManage) return undefined;
    return {
      onViewFull: onOpenGuardCredential
        ? (credentialItemId: string) => onOpenGuardCredential(guard.id, credentialItemId)
        : undefined,
      onEditFullPage: canManage ? () => setEditing(true) : undefined,
    };
  }, [onOpenGuardCredential, canManage, guard.id, onEditingChange, controlledEditing]);
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
    listedWeaponGear: guard.listedWeaponGear ?? [],
    listedEquipmentGear: guard.listedEquipmentGear ?? [],
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
      listedWeaponGear: guard.listedWeaponGear ?? [],
      listedEquipmentGear: guard.listedEquipmentGear ?? [],
    });
  }, [guard]);

  const guardAccountStatus = getGuardUserStatus(guard);
  const makeCrewLeadBlocker = staffMakeCrewLeadBlocker(guard, standingCrewMembers);
  const alreadyCrewLead = guardLeadsOwnStandingCrew(guard, standingCrewMembers);
  const progress = getQualificationProgress(guard);
  const activationChecklist = getGuardActivationChecklist(guard);
  const groupedCerts = useMemo(() => groupGuardCertsByCategory(guard), [guard]);

  const completedJobsCount = useMemo(
    () =>
      requests.filter((r) => r.assignedGuardId === guard.id && r.status === 'completed').length,
    [requests, guard.id]
  );

  const allGuardJobs = useMemo(
    () =>
      requests
        .filter((r) => r.assignedGuardId === guard.id)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [requests, guard.id]
  );
  const guardJobs = useMemo(() => allGuardJobs.slice(0, 8), [allGuardJobs]);

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
      hourlyRateRequirement: hourlyRate ? Math.max(0, parseInt(hourlyRate, 10) || 0) : resume.hourlyRateRequirement,
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
    if (!(await showAppConfirm({
      title: 'Delete guard account?',
      message: `Delete guard account for ${guard.name}? This cannot be undone.`,
      confirmLabel: 'Delete account',
      tone: 'danger',
    }))) {
      return;
    }
    setDeleting(true);
    try {
      await onDeleteGuard(guard.id);
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not delete guard account.', { tone: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleTrusted = async () => {
    if (!onSetGuardTrusted) return;
    const affectedJobs = guard.trusted
      ? requests.filter((j) => jobAffectedByTrustedRevocation(guard.id, j))
      : [];
    const confirmed = guard.trusted
      ? await confirmRemoveGuardTrusted(guard.name, {
          crewJobCount: affectedJobs.filter((j) => j.teamLeadId === guard.id).length,
          scheduledJobCount: affectedJobs.filter((j) => j.status === 'accepted').length,
        })
      : await confirmMarkGuardTrusted(guard.name);
    if (!confirmed) return;
    await onSetGuardTrusted(!guard.trusted);
  };

  const handleMakeCrewLead = async () => {
    if (!onMakeCrewLead) return;
    const blocker = staffMakeCrewLeadBlocker(guard, standingCrewMembers);
    if (blocker) {
      showAppToast(blocker, { tone: 'error' });
      return;
    }
    await onMakeCrewLead();
  };

  const handleUpdateUserStatus = async (status: 'active' | 'suspended' | 'blocked') => {
    const confirmed =
      status === 'suspended'
        ? await confirmSuspendAccount(guard.name, 'guard')
        : status === 'blocked'
        ? await confirmBlockAccount(guard.name, 'guard')
        : await confirmRestoreAccount(guard.name, 'guard');
    if (!confirmed) return;
    onUpdateUserStatus(guard.id, status);
  };

  const handleApproveProfile = async () => {
    if (!onApproveGuardAccount || !guardCanStaffApproveProfile(guard)) return;
    if (!(await confirmApproveGuardProfile(guard.name))) return;
    try {
      await onApproveGuardAccount(guard.id);
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not approve profile.', { tone: 'error' });
    }
  };

  const handleBackgroundCheckToggle = async () => {
    if (!onUpdateBackgroundChecked) return;
    if (!(await confirmBackgroundCheckToggle(guard.name, !guard.backgroundChecked))) return;
    onUpdateBackgroundChecked(guard.id, !guard.backgroundChecked);
  };

  const handleResetAuditFailures = async () => {
    if (!onResetAuditFailures) return;
    const count = guard.failedAudits ?? 0;
    if (!(await confirmClearAuditViolations(guard.name, count))) return;
    onResetAuditFailures(guard.id);
  };

  const renderAccountControlsSection = (showProfileEdit: boolean) => {
    if (!canManage || guard.isStaff) return null;

    return (
      <section className="staff-detail-section space-y-3">
        <WfSectionHeader title="Account controls" className="!px-0 !mb-0" />
        <div className="staff-detail-actions">
          {canEdit && showProfileEdit && (
            <>
              <AppButton
                variant="primary"
                size="sm"
                onClick={() => (editing ? void handleSave() : setEditing(true))}
                disabled={saving}
                startEnhancer={editing ? <Save className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              >
                {editing ? (saving ? 'Saving…' : 'Save profile') : 'Edit profile'}
              </AppButton>
              {editing && (
                <AppButton variant="outline" size="sm" onClick={handleCancelEdit}>
                  Cancel
                </AppButton>
              )}
            </>
          )}
          {guardAccountStatus === 'pending' && (onOpenGuardApplication || onApproveGuardAccount) && (
            <AppButton
              variant="primary"
              size="sm"
              className="staff-action-btn--ok"
              onClick={() => {
                if (onOpenGuardApplication) {
                  onOpenGuardApplication(guard.id);
                  return;
                }
                void handleApproveProfile();
              }}
              disabled={!onOpenGuardApplication && !guardCanStaffApproveProfile(guard)}
              title={
                onOpenGuardApplication
                  ? 'Open this application in Applications to review and approve'
                  : activationChecklist.staffApprovalBlockers.length > 0
                    ? activationChecklist.staffApprovalBlockers.join(' · ')
                    : 'Approve guard application'
              }
            >
              {onOpenGuardApplication ? 'Review application' : 'Approve application'}
            </AppButton>
          )}
          {onDeleteGuard && (guardAccountStatus !== 'pending' || canSuspend) && (
            <AppButton
              variant="danger"
              size="sm"
              className="staff-action-btn--danger"
              onClick={() => void handleDeleteGuard()}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete account'}
            </AppButton>
          )}
          {canSuspend && guardAccountStatus !== 'suspended' && guardAccountStatus === 'active' && (
            <AppButton
              variant="outline"
              size="sm"
              className="staff-action-btn--warn"
              onClick={() => void handleUpdateUserStatus('suspended')}
            >
              Suspend
            </AppButton>
          )}
          {canSuspend && guardAccountStatus !== 'blocked' && guardAccountStatus === 'active' && (
            <AppButton
              variant="danger"
              size="sm"
              className="staff-action-btn--danger"
              onClick={() => void handleUpdateUserStatus('blocked')}
            >
              Flag / Block
            </AppButton>
          )}
          {canSuspend && (guardAccountStatus === 'suspended' || guardAccountStatus === 'blocked') && (
            <AppButton
              variant="primary"
              size="sm"
              className="staff-action-btn--ok"
              onClick={() => void handleUpdateUserStatus('active')}
            >
              Restore account
            </AppButton>
          )}
          {(guard.failedAudits ?? 0) > 0 && onResetAuditFailures && (
            <AppButton
              variant="outline"
              size="sm"
              className="staff-action-btn--warn"
              onClick={() => void handleResetAuditFailures()}
            >
              Clear violations ({guard.failedAudits}/3)
            </AppButton>
          )}
          {onUpdateBackgroundChecked && (
            <AppButton
              variant="outline"
              size="sm"
              className={guard.backgroundChecked ? 'staff-action-btn--warn' : 'staff-action-btn--ok'}
              onClick={() => void handleBackgroundCheckToggle()}
            >
              {guard.backgroundChecked ? 'Clear background check' : 'Mark background checked'}
            </AppButton>
          )}
          {onSetGuardTrusted && (guardAccountStatus === 'active' && guard.verified || guard.trusted) && (
            <AppButton
              variant={guard.trusted ? 'outline' : 'primary'}
              size="sm"
              className={guard.trusted ? 'staff-action-btn--warn' : 'staff-action-btn--ok'}
              onClick={() => void handleToggleTrusted()}
              title={
                guard.trusted
                  ? 'Remove trusted status — guard will require Guardr applicant review'
                  : 'Mark as trusted — skips Guardr review on Stripe jobs; cash always needs staff confirmation'
              }
            >
              {guard.trusted ? 'Remove trusted' : 'Mark as trusted'}
            </AppButton>
          )}
          {onSetGuardTrusted && guardAccountStatus !== 'active' && !guard.trusted && (
            <AppButton
              variant="primary"
              size="sm"
              className="staff-action-btn--ok"
              disabled
              title="Guard must be approved and active before they can be marked as trusted."
            >
              Mark as trusted
            </AppButton>
          )}
          {onMakeCrewLead && !alreadyCrewLead && (
            <AppButton
              variant="primary"
              size="sm"
              className="staff-action-btn--ok"
              disabled={Boolean(makeCrewLeadBlocker)}
              onClick={() => void handleMakeCrewLead()}
              title={makeCrewLeadBlocker ?? 'Initialize this guard as a standing crew lead'}
            >
              Make crew lead
            </AppButton>
          )}
        </div>
      </section>
    );
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
      listedWeaponGear: guard.listedWeaponGear ?? [],
      listedEquipmentGear: guard.listedEquipmentGear ?? [],
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
    void (async () => {
      const note = await promptStaffResubmitNote(`${certDisplayName(cert)} photo`);
      if (note === null) return;
      void onRequestCertImageResubmit(guard.id, cert.id, note);
    })();
  };

  const renderStaffCertActions = (cert: Certification) => {
    if (!canVerifyCredentials || cert.status !== 'pending') return null;

    if (onOpenGuardCredential) {
      return (
        <AppButton
          variant="primary"
          size="sm"
          onClick={() => onOpenGuardCredential(guard.id, cert.id)}
          startEnhancer={<Check className="w-3 h-3" />}
        >
          Review credential
        </AppButton>
      );
    }

    return (
      <div className="flex flex-col items-stretch gap-1.5 w-full">
        <div className="app-action-row--equal w-full">
          {cert.imageUrl && onRequestCertImageResubmit && (
            <AppButton
              variant="outline"
              size="sm"
              onClick={() => requestCertResubmit(cert)}
            >
              Request clearer photo
            </AppButton>
          )}
          <AppButton
            variant="danger"
            size="sm"
            onClick={() => onRejectCert(guard.id, cert.id)}
            startEnhancer={<X className="w-3 h-3" />}
          >
            Reject
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            disabled={!staffCanVerifyCertification(cert, guard)}
            title={staffVerifyCertificationBlocker(cert, guard) ?? 'Verify credential'}
            onClick={() => {
              void (async () => {
                try {
                  await onApproveCert(guard.id, cert.id);
                } catch (err) {
                  showAppToast(err instanceof Error ? err.message : 'Could not verify credential.', { tone: 'error' });
                }
              })();
            }}
            startEnhancer={<Check className="w-3 h-3" />}
          >
            Verify
          </AppButton>
        </div>
        {staffVerifyCertificationBlocker(cert, guard) && (
          <p className="text-xs text-amber-500 leading-relaxed break-words">
            {staffVerifyCertificationBlocker(cert, guard)}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={`staff-detail-pane ${compact ? '' : 'min-w-0'}`}>
      {onBack && (
        <div className="app-subscreen-header app-subscreen-header--back-only">
          <button type="button" onClick={onBack} className="app-subscreen-back">
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Back to Guards
          </button>
        </div>
      )}

      {!guard.isStaff && onStaffGuardTabChange && !performanceFactorId && (
        <div className="staff-guard-detail-tabs">
          <StaffListFilterTabs
            aria-label="Guard detail"
            activeId={staffGuardTab}
            onChange={(id) => onStaffGuardTabChange(id as StaffGuardDetailTab)}
            tabs={[
              { id: 'profile', label: 'Profile' },
              { id: 'certs', label: 'Credentials' },
              { id: 'performance', label: 'Guard status' },
            ]}
          />
        </div>
      )}

      {staffGuardTab === 'performance' && !guard.isStaff ? (
        <StaffGuardPerformancePanel
          guard={guard}
          requests={requests}
          performanceFactorId={performanceFactorId}
          onPerformanceFactorChange={onPerformanceFactorChange}
          onOpenJob={onOpenJob}
        />
      ) : staffGuardTab === 'certs' && !guard.isStaff ? (
        <section className="staff-detail-section space-y-3">
          {renderAccountControlsSection(false)}
          {canManage && (
            <div className="staff-detail-actions">
              {canEdit && (
                <>
                  <AppButton
                    variant="primary"
                    size="sm"
                    onClick={() => (editing ? void handleSave() : setEditing(true))}
                    disabled={saving}
                    startEnhancer={editing ? <Save className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  >
                    {editing ? (saving ? 'Saving…' : 'Save profile') : 'Edit credentials'}
                  </AppButton>
                  {editing && (
                    <AppButton variant="outline" size="sm" onClick={handleCancelEdit}>
                      Cancel
                    </AppButton>
                  )}
                </>
              )}
            </div>
          )}
          <GuardCredentialsPanel
            guard={guard}
            editing={editing && canEdit}
            weaponGearEditing={editing && canEdit}
            equipmentGearEditing={editing && canEdit}
            weaponGearSelected={resume.listedWeaponGear ?? guard.listedWeaponGear ?? []}
            equipmentGearSelected={resume.listedEquipmentGear ?? guard.listedEquipmentGear ?? []}
            onWeaponGearChange={(listedWeaponGear) =>
              setResume((r) => ({ ...r, listedWeaponGear }))
            }
            onEquipmentGearChange={(listedEquipmentGear) =>
              setResume((r) => ({ ...r, listedEquipmentGear }))
            }
            staffMode={canManage}
            onSubmitIdentityVerification={
              onUpdateGuardIdImages
                ? (payload) => onUpdateGuardIdImages(guard.id, payload)
                : undefined
            }
            onAddCertification={canManage ? onAddCertification : undefined}
            onDeleteCertification={canManage ? onDeleteCertification : undefined}
            onAttachCertificationImage={canManage ? onAttachCertificationImage : undefined}
            onUpdateCertification={onUpdateCertification}
            onReviewInsurance={
              onReviewInsurance
                ? (status, rejectionReason) => Promise.resolve(onReviewInsurance(status, rejectionReason))
                : undefined
            }
            staffIdReview={
              canManage ? (
                <StaffIdReviewSection
                  guard={guard}
                  canManage={canManage}
                  documentTypeEdit="credentials-flag"
                  onApprove={
                    onOpenGuardCredential
                      ? (guardId) => onOpenGuardCredential(guardId, govIdApprovalItemId(guardId))
                      : onApproveIdentityVerification
                        ? () => onApproveIdentityVerification(guard.id)
                        : undefined
                  }
                  approveActionLabel={onOpenGuardCredential ? 'Review in Credentials' : undefined}
                  onRequestResubmit={
                    onRequestIdentityResubmit
                      ? (guardId, slots, staffNote) => onRequestIdentityResubmit(guardId, slots, staffNote)
                      : undefined
                  }
                />
              ) : undefined
            }
            renderCertActions={renderStaffCertActions}
            certOverlayNav={certOverlayNav}
          />
          {canManage ? (
            <StaffVehicleReviewSection
              guard={guard}
              canManage={canManage}
              onApprove={onApproveVehicle}
              onReject={onRejectVehicle}
            />
          ) : null}
        </section>
      ) : (
        <>
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
              <EditField label="Min hourly rate ($)" value={hourlyRate} onChange={setHourlyRate} type="number" min={0} />
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
                <p className="wf-metric-label">Completed</p>
                <p className="wf-metric-value">{completedJobsCount}</p>
              </div>
            </div>
          )}
          {!guard.isStaff && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <GuardArmedStatusPill guard={guard} />
              <GuardRosterStatusBadges guard={guard} className="shrink-0" />
            </div>
          )}
        </div>
      </div>

      {!guard.isStaff && (
        <>
          {renderAccountControlsSection(true)}

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
                onSubmitIdentityVerification={
                  onUpdateGuardIdImages
                    ? (payload) => onUpdateGuardIdImages(guard.id, payload)
                    : onSubmitIdentityVerification
                }
                onReviewInsurance={
                  onReviewInsurance
                    ? async (status, rejectionReason) => {
                        await onReviewInsurance(status, rejectionReason);
                      }
                    : undefined
                }
                hideCredentials
                hideGear
              />
            </section>
          )}

          {/* Standing crew section — shown for trusted guards */}
          {guard.trusted && !editing && (
            <section className="staff-detail-section space-y-3">
              <WfSectionHeader title="Standing crew" className="!px-0 !mb-0" />
              {guard.standingCrewName ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-brand-text">{guard.standingCrewName}</p>
                      <WfBadge tone="primary">Trusted lead</WfBadge>
                    </div>
                    {guard.standingCrewDescription && (
                      <p className="text-xs text-brand-text-muted leading-relaxed">
                        {guard.standingCrewDescription}
                      </p>
                    )}
                  </div>
                  {(() => {
                    const activeMembers = getActiveStandingCrewMembers(standingCrewMembers, guard.id);
                    const pendingMembers = getPendingStandingCrewOutgoing(standingCrewMembers, guard.id);
                    const allMembers = [...activeMembers, ...pendingMembers];
                    return allMembers.length === 0 ? (
                      <p className="text-xs text-brand-text-muted">No crew members yet.</p>
                    ) : (
                      <div className="divide-y divide-brand-border border-t border-brand-border">
                        {allMembers.map((m) => {
                          // memberGuardId refers to a guard in the platform; we only have
                          // this guard's own data here, so show ID if not resolvable
                          const displayName = m.memberGuardId;
                          return (
                            <div key={m.id} className="flex items-center gap-3 py-2.5">
                              <div className="w-7 h-7 rounded-full bg-brand-bg-sec border border-brand-border flex items-center justify-center shrink-0">
                                <User className="w-3.5 h-3.5 text-brand-text-muted" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-brand-text truncate">
                                  {displayName}
                                </p>
                              </div>
                              <WfBadge tone={m.status === 'active' ? 'success' : 'warning'}>
                                {m.status === 'active' ? 'Active' : 'Pending'}
                              </WfBadge>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <p className="text-sm text-brand-text-muted">
                  <Users className="w-4 h-4 inline mr-1.5 opacity-60" />
                  Trusted guard — no crew profile set yet. They can configure their team name and
                  invite members from their Crew hub.
                </p>
              )}
            </section>
          )}

          <section className="staff-detail-section space-y-2">
            <WfSectionHeader title="Recent jobs" className="!px-0 !mb-0" />
            {guardJobs.length === 0 ? (
              <p className="text-sm text-brand-text-muted">No jobs on record.</p>
            ) : (
              <>
                {allGuardJobs.length > guardJobs.length && (
                  <p className="text-xs text-brand-text-muted">
                    Showing {guardJobs.length} most recent of {allGuardJobs.length} jobs
                  </p>
                )}
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
              </>
            )}
          </section>
        </>
      )}

      {guard.isStaff && guard.phone && (
        <section className="staff-detail-section">
          <p className="text-sm mt-2">{guard.phone}</p>
        </section>
      )}

      {guard.bio && !guard.isStaff && !editing && (
        <section className="staff-detail-section">
          <WfSectionHeader title="Bio" className="!px-0 !mb-2" />
          <p className="text-sm text-brand-text-muted leading-relaxed">{guard.bio}</p>
        </section>
      )}
        </>
      )}
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = 'text',
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
}) {
  return (
    <div>
      <label className="wf-metric-label">{label}</label>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="uber-input w-full mt-1 text-sm"
      />
    </div>
  );
}
