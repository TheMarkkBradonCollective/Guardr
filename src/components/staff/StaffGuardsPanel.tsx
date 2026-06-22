import React, { useEffect, useState } from 'react';
import { Certification, Experience, GuardEducation, SecurityGuard, SecurityRequest } from '../../types';
import { getGuardDisplayStatus, GUARD_STATUS_LABELS } from '../../lib/guardQualification';
import { getGuardUserStatus, GUARD_USER_STATUS_LABELS } from '../../lib/accountStatus';
import { useDevice } from '../../lib/platform';
import { StaffGuardDetailPanel } from './StaffGuardDetailPanel';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
import { StaffAddGuardForm } from './StaffAddGuardForm';
import type { StaffAddGuardInput } from './StaffAddGuardForm';
import type { StaffAddClientInput } from './StaffAddClientForm';
import { ProfileSavePayload } from '../profile/UserProfileScreen';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import { GUARD_TRUSTED_BADGE_LABEL, isGuardTrusted } from '../../lib/guardTrust';

interface StaffGuardsPanelProps {
  guards: SecurityGuard[];
  requests: SecurityRequest[];
  canManage: boolean;
  canSuspend: boolean;
  onUpdateUserStatus: (id: string, status: 'active' | 'suspended' | 'blocked') => void;
  onResetAuditFailures?: (id: string) => void;
  onApproveCert: (guardId: string, certId: string) => void;
  onRejectCert: (guardId: string, certId: string) => void;
  onUpdateBackgroundChecked?: (guardId: string, checked: boolean) => void;
  onUpdateProfile?: (guardId: string, payload: ProfileSavePayload) => void | Promise<void>;
  onAddCertification?: (guardId: string, cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onDeleteCertification?: (guardId: string, certId: string) => Promise<CertImageMutationResult>;
  onAttachCertificationImage?: (
    guardId: string,
    certId: string,
    imageUrl: string
  ) => Promise<CertImageMutationResult>;
  onAddExperience?: (guardId: string, exp: Omit<Experience, 'id'>) => void | Promise<void>;
  onAddEducation?: (guardId: string, edu: Omit<GuardEducation, 'id'>) => void | Promise<void>;
  onApproveGuardAccount?: (guardId: string) => void | Promise<void>;
  onDeleteGuard?: (guardId: string) => void | Promise<void>;
  onSubmitIdentityVerification?: (
    guardId: string,
    payload: import('../profile/GuardIdentityVerificationPanel').GuardIdentityVerificationPayload
  ) => Promise<import('../profile/GuardIdentityVerificationPanel').IdentityVerificationSubmitResult>;
  onApproveIdentityVerification?: (guardId: string) => void | Promise<void>;
  onRejectIdentityVerification?: (guardId: string, reason?: string) => void | Promise<void>;
  onRequestIdentityResubmit?: (
    guardId: string,
    slots: import('../../lib/staffDocumentReview').IdVerificationSlot[],
    staffNote?: string
  ) => void | Promise<void>;
  onRequestCertImageResubmit?: (guardId: string, certId: string, staffNote?: string) => void | Promise<void>;
  onUpdateGuardIdImages?: (
    guardId: string,
    payload: import('../profile/GuardIdentityVerificationPanel').GuardIdentityVerificationPayload
  ) => Promise<import('../profile/GuardIdentityVerificationPanel').IdentityVerificationSubmitResult>;
  selectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
  staffEdit?: boolean;
  onStaffEditChange?: (editing: boolean) => void;
  initialSelectedId?: string | null;
  onOpenJob?: (jobId: string) => void;
  onAddGuard?: (input: StaffAddGuardInput) => Promise<string>;
}

export function StaffGuardsPanel({
  guards,
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
  onAddExperience,
  onAddEducation,
  onApproveGuardAccount,
  onDeleteGuard,
  onSubmitIdentityVerification,
  onApproveIdentityVerification,
  onRejectIdentityVerification,
  onRequestIdentityResubmit,
  onRequestCertImageResubmit,
  onUpdateGuardIdImages,
  selectedId: controlledSelectedId,
  onSelectedIdChange,
  staffEdit,
  onStaffEditChange,
  initialSelectedId = null,
  onOpenJob,
  onAddGuard,
}: StaffGuardsPanelProps) {
  const [search, setSearch] = useState('');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(initialSelectedId);
  const isControlled = controlledSelectedId !== undefined;
  const selectedId = isControlled ? controlledSelectedId : internalSelectedId;

  const setSelectedId = (id: string | null) => {
    if (!isControlled) setInternalSelectedId(id);
    onSelectedIdChange?.(id);
  };

  useEffect(() => {
    if (isControlled) return;
    setInternalSelectedId(initialSelectedId);
  }, [initialSelectedId, isControlled]);
  const { formFactor } = useDevice();
  const splitView = formFactor === 'tablet' || formFactor === 'desktop';

  const roster = guards.filter((g) => !g.isStaff);

  const filtered = roster.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase()) ||
      g.badgeNumber.toLowerCase().includes(search.toLowerCase())
  );

  const selected = filtered.find((g) => g.id === selectedId) ?? (splitView ? filtered[0] : null) ?? null;
  const showDetailOnly = Boolean(selected && !splitView);

  const detailProps = selected
    ? {
        guard: selected,
        requests,
        canManage,
        canSuspend,
        onUpdateUserStatus,
        onResetAuditFailures,
        onApproveCert,
        onRejectCert,
        onUpdateBackgroundChecked,
        onUpdateProfile: onUpdateProfile ? (payload: ProfileSavePayload) => onUpdateProfile(selected.id, payload) : undefined,
        onAddCertification: onAddCertification ? (cert: Partial<Certification>) => onAddCertification(selected.id, cert) : undefined,
        onDeleteCertification: onDeleteCertification ? (certId: string) => onDeleteCertification(selected.id, certId) : undefined,
        onAttachCertificationImage: onAttachCertificationImage
          ? (certId: string, imageUrl: string) => onAttachCertificationImage(selected.id, certId, imageUrl)
          : undefined,
        onAddExperience: onAddExperience ? (exp: Omit<Experience, 'id'>) => onAddExperience(selected.id, exp) : undefined,
        onAddEducation: onAddEducation ? (edu: Omit<GuardEducation, 'id'>) => onAddEducation(selected.id, edu) : undefined,
        onApproveGuardAccount,
        onDeleteGuard,
        onSubmitIdentityVerification: onSubmitIdentityVerification
          ? (payload) => onSubmitIdentityVerification(selected.id, payload)
          : undefined,
        onApproveIdentityVerification: onApproveIdentityVerification
          ? () => onApproveIdentityVerification(selected.id)
          : undefined,
        onRejectIdentityVerification: onRejectIdentityVerification
          ? (reason) => onRejectIdentityVerification(selected.id, reason)
          : undefined,
        onRequestIdentityResubmit: onRequestIdentityResubmit
          ? (slots, staffNote) => onRequestIdentityResubmit(selected.id, slots, staffNote)
          : undefined,
        onRequestCertImageResubmit: onRequestCertImageResubmit
          ? (certId, staffNote) => onRequestCertImageResubmit(selected.id, certId, staffNote)
          : undefined,
        onUpdateGuardIdImages: onUpdateGuardIdImages
          ? (payload) => onUpdateGuardIdImages(selected.id, payload)
          : undefined,
        onOpenJob,
      }
    : null;

  function renderGuardCard(guard: SecurityGuard, isActive: boolean) {
    const activeShift = requests.find(
      (r) => r.assignedGuardId === guard.id && (r.status === 'in-progress' || r.status === 'accepted')
    );
    const accountStatus = getGuardUserStatus(guard);
    const pendingCerts = guard.certifications.filter((c) => c.status === 'pending').length;

    return (
      <WfListCard
        key={guard.id}
        avatar={<ProfileAvatar src={guard.avatar} name={guard.name} size="sm" rounded="lg" />}
        title={guard.name}
        subtitle={`${guard.badgeNumber} · ★ ${guard.rating}`}
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            {pendingCerts > 0 && (
              <WfBadge tone="warning">{pendingCerts} pending</WfBadge>
            )}
            {accountStatus === 'pending' && (
              <WfBadge tone="warning">Awaiting approval</WfBadge>
            )}
            {isGuardTrusted(guard) && (
              <WfBadge tone="success">{GUARD_TRUSTED_BADGE_LABEL}</WfBadge>
            )}
            <span>
              {GUARD_STATUS_LABELS[getGuardDisplayStatus(guard)]} · {GUARD_USER_STATUS_LABELS[accountStatus]}
            </span>
            {activeShift && <span>On: {activeShift.title}</span>}
          </div>
        }
        onClick={() => setSelectedId(guard.id)}
        className={isActive ? 'app-item-card-selected' : ''}
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      {!showDetailOnly && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <p className="text-sm text-brand-text-muted flex-1">
              Field guards who accept jobs — staff can add profiles, edit credentials, verify documents, and manage accounts.
            </p>
            {canManage && onAddGuard && (
              <StaffAddGuardForm
                onAdd={onAddGuard}
                onCreated={(guardId) => {
                  setSearch('');
                  setSelectedId(guardId);
                }}
              />
            )}
          </div>
          <WfSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search guards..."
            className="max-w-md"
          />
        </>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-brand-text-muted py-12 text-center border border-dashed border-brand-border rounded-xl">
          {roster.length === 0
            ? 'No field guards yet. Use Add guard above to create the first profile.'
            : 'No field guards match your search.'}
        </p>
      ) : showDetailOnly && detailProps ? (
        <StaffGuardDetailPanel
          {...detailProps}
          editing={staffEdit}
          onEditingChange={onStaffEditChange}
          onBack={() => setSelectedId(null)}
        />
      ) : splitView ? (
        <div className="tablet-split-panel">
          <div className="max-h-[75vh] overflow-y-auto pr-1">
            <AppItemCardStack>
              {filtered.map((guard) => renderGuardCard(guard, selected?.id === guard.id))}
            </AppItemCardStack>
          </div>
          {detailProps && (
            <StaffGuardDetailPanel
              {...detailProps}
              editing={staffEdit}
              onEditingChange={onStaffEditChange}
            />
          )}
        </div>
      ) : (
        <AppItemCardStack>
          {filtered.map((guard) => renderGuardCard(guard, false))}
        </AppItemCardStack>
      )}
    </div>
  );
}
