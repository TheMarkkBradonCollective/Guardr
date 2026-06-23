import React, { useEffect, useState } from 'react';
import { Certification, Experience, GuardEducation, SecurityGuard, SecurityRequest } from '../../types';
import { ListDetailLayout, useSplitListDetail } from '../ui/app/ListDetailLayout';
import { StaffGuardDetailPanel } from './StaffGuardDetailPanel';
import { GuardRosterStatusBadges, guardRosterSortRank } from './GuardRosterStatusBadges';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
import { StaffAddGuardForm } from './StaffAddGuardForm';
import type { StaffAddGuardInput } from './StaffAddGuardForm';
import type { StaffAddClientInput } from './StaffAddClientForm';
import { ProfileSavePayload } from '../profile/UserProfileScreen';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import { GuardMissingCredentialsBadge } from './GuardMissingCredentialsBadge';
import { guardHasMissingWorkCredentials } from '../../lib/guardMissingCredentials';

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
  onUpdateCertification?: (
    guardId: string,
    certId: string,
    payload: import('../credentials/CertDetailModal').CertUpdatePayload
  ) => Promise<import('../credentials/CertDetailModal').CertUpdateResult>;
  onAddExperience?: (guardId: string, exp: Omit<Experience, 'id'>) => void | Promise<void>;
  onAddEducation?: (guardId: string, edu: Omit<GuardEducation, 'id'>) => void | Promise<void>;
  onApproveGuardAccount?: (guardId: string) => void | Promise<void>;
  onActivateGuardAccount?: (
    guardId: string,
    options?: import('../../lib/guardMissingCredentials').ActivateGuardAccountOptions
  ) => void | Promise<void>;
  onSetGuardTrusted?: (guardId: string, trusted: boolean) => void | Promise<void>;
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
  onUpdateCertification,
  onAddExperience,
  onAddEducation,
  onApproveGuardAccount,
  onActivateGuardAccount,
  onSetGuardTrusted,
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
  const roster = guards.filter((g) => !g.isStaff);

  const filtered = roster
    .filter(
      (g) =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.email.toLowerCase().includes(search.toLowerCase()) ||
        g.badgeNumber.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const rank = guardRosterSortRank(a) - guardRosterSortRank(b);
      if (rank !== 0) return rank;
      return a.name.localeCompare(b.name);
    });

  const { showDetailOnly } = useSplitListDetail(selectedId, 'page');

  function buildDetailProps(guard: SecurityGuard) {
    return {
      guard,
      requests,
      canManage,
      canSuspend,
      onUpdateUserStatus,
      onResetAuditFailures,
      onApproveCert,
      onRejectCert,
      onUpdateBackgroundChecked,
      onUpdateProfile: onUpdateProfile ? (payload: ProfileSavePayload) => onUpdateProfile(guard.id, payload) : undefined,
      onAddCertification: onAddCertification ? (cert: Partial<Certification>) => onAddCertification(guard.id, cert) : undefined,
      onDeleteCertification: onDeleteCertification ? (certId: string) => onDeleteCertification(guard.id, certId) : undefined,
      onAttachCertificationImage: onAttachCertificationImage
        ? (certId: string, imageUrl: string) => onAttachCertificationImage(guard.id, certId, imageUrl)
        : undefined,
      onUpdateCertification: onUpdateCertification
        ? (certId, payload) => onUpdateCertification(guard.id, certId, payload)
        : undefined,
      onAddExperience: onAddExperience ? (exp: Omit<Experience, 'id'>) => onAddExperience(guard.id, exp) : undefined,
      onAddEducation: onAddEducation ? (edu: Omit<GuardEducation, 'id'>) => onAddEducation(guard.id, edu) : undefined,
      onApproveGuardAccount,
      onActivateGuardAccount,
      onSetGuardTrusted: onSetGuardTrusted ? (trusted: boolean) => onSetGuardTrusted(guard.id, trusted) : undefined,
      onDeleteGuard,
      onSubmitIdentityVerification: onSubmitIdentityVerification
        ? (payload) => onSubmitIdentityVerification(guard.id, payload)
        : undefined,
      onApproveIdentityVerification: onApproveIdentityVerification
        ? () => onApproveIdentityVerification(guard.id)
        : undefined,
      onRejectIdentityVerification: onRejectIdentityVerification
        ? (reason) => onRejectIdentityVerification(guard.id, reason)
        : undefined,
      onRequestIdentityResubmit: onRequestIdentityResubmit
        ? (slots, staffNote) => onRequestIdentityResubmit(guard.id, slots, staffNote)
        : undefined,
      onRequestCertImageResubmit: onRequestCertImageResubmit
        ? (certId, staffNote) => onRequestCertImageResubmit(guard.id, certId, staffNote)
        : undefined,
      onUpdateGuardIdImages: onUpdateGuardIdImages
        ? (payload) => onUpdateGuardIdImages(guard.id, payload)
        : undefined,
      onOpenJob,
    };
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
      ) : (
        <ListDetailLayout
          items={filtered}
          selectedId={selectedId}
          onSelectId={setSelectedId}
          getItemId={(guard) => guard.id}
          listScrollClassName="max-h-[75vh] overflow-y-auto pr-1"
          renderItem={(guard, isActive, onSelect) => {
            const activeShift = requests.find(
              (r) => r.assignedGuardId === guard.id && (r.status === 'in-progress' || r.status === 'accepted')
            );
            const pendingCerts = guard.certifications.filter((c) => c.status === 'pending').length;
            const secondaryMeta =
              pendingCerts > 0 || guardHasMissingWorkCredentials(guard) || Boolean(activeShift);

            return (
              <WfListCard
                avatar={<ProfileAvatar src={guard.avatar} name={guard.name} size="sm" rounded="lg" />}
                title={guard.name}
                subtitle={`${guard.badgeNumber} · ★ ${guard.rating}`}
                meta={
                  <div className="flex flex-col items-start gap-1.5 w-full">
                    <GuardRosterStatusBadges guard={guard} />
                    {secondaryMeta && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {pendingCerts > 0 && (
                          <WfBadge tone="warning">
                            {pendingCerts} cred{pendingCerts === 1 ? '' : 's'} pending
                          </WfBadge>
                        )}
                        <GuardMissingCredentialsBadge guard={guard} />
                        {activeShift && (
                          <WfBadge tone="primary" className="max-w-full truncate">
                            On job: {activeShift.title}
                          </WfBadge>
                        )}
                      </div>
                    )}
                  </div>
                }
                onClick={onSelect}
                className={isActive ? 'app-item-card-selected' : ''}
              />
            );
          }}
          renderDetail={(guard, options) => (
            <StaffGuardDetailPanel
              {...buildDetailProps(guard)}
              editing={staffEdit}
              onEditingChange={onStaffEditChange}
              onBack={options?.onBack}
            />
          )}
          mobilePresentation="page"
        />
      )}
    </div>
  );
}
