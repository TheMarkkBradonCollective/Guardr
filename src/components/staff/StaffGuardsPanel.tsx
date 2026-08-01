import React, { useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import {
  Certification,
  Experience,
  GuardEducation,
  GuardStandingCrewMember,
  SecurityGuard,
  SecurityRequest,
} from '../../types';
import { ListDetailLayout, useSplitListDetail } from '../ui/app/ListDetailLayout';
import { StaffGuardDetailPanel } from './StaffGuardDetailPanel';
import { GuardRosterStatusBadges, guardRosterSortRank } from './GuardRosterStatusBadges';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfListCard, WfSearchBar } from '../ui/wireframe';
import { StaffAddGuardForm } from './StaffAddGuardForm';
import type { StaffAddGuardInput } from './StaffAddGuardForm';
import type { StaffAddClientInput } from './StaffAddClientForm';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import { ProfileSavePayload } from '../profile/UserProfileScreen';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import {
  matchesGuardRosterFilter,
  type GuardRosterFilter,
} from '../../lib/staffListFilters';
import { StaffListFilterTabs } from './StaffListFilterTabs';
import type { StaffGuardDetailTab } from '../../lib/appNavigation';
import type { PerformanceFactorId } from '../../lib/guardPerformanceFactorDetail';
import { useDevice } from '../../lib/platform';
import { StatusChip, type StatusTone } from '../baseui/StatusChip';
import { UberDataTable, type UberTableColumn } from '../baseui/UberDataTable';
import { getGuardUserStatus, GUARD_USER_STATUS_LABELS } from '../../lib/accountStatus';
import {
  WorkbenchEmpty,
  WorkbenchPage,
  WorkbenchPanel,
  WorkbenchSplit,
} from '../baseui/layout/WorkbenchLayout';

interface StaffGuardsPanelProps {
  guards: SecurityGuard[];
  requests: SecurityRequest[];
  standingCrewMembers?: GuardStandingCrewMember[];
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
  onRejectGuardApplication?: (guardId: string, reason?: string) => void | Promise<void>;
  onSetGuardTrusted?: (guardId: string, trusted: boolean) => void | Promise<void>;
  onMakeCrewLead?: (guardId: string) => void | Promise<void>;
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
  onReviewGuardInsurance?: (
    guardId: string,
    status: 'verified' | 'rejected',
    rejectionReason?: string
  ) => void | Promise<void>;
  onApproveVehicle?: (guardId: string) => void | Promise<void>;
  onRejectVehicle?: (guardId: string, reason?: string) => void | Promise<void>;
  onUpdateGuardIdImages?: (
    guardId: string,
    payload: import('../profile/GuardIdentityVerificationPanel').GuardIdentityVerificationPayload
  ) => Promise<import('../profile/GuardIdentityVerificationPanel').IdentityVerificationSubmitResult>;
  canVerifyCredentials?: boolean;
  selectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
  staffEdit?: boolean;
  onStaffEditChange?: (editing: boolean) => void;
  staffGuardTab?: StaffGuardDetailTab;
  onStaffGuardTabChange?: (tab: StaffGuardDetailTab) => void;
  performanceFactorId?: PerformanceFactorId | null;
  onPerformanceFactorChange?: (factorId: PerformanceFactorId | null) => void;
  initialSelectedId?: string | null;
  onOpenJob?: (jobId: string) => void;
  onOpenGuardApplication?: (guardId: string) => void;
  onOpenGuardCredential?: (guardId: string, credentialItemId: string) => void;
  onAddGuard?: (input: StaffAddGuardInput) => Promise<string>;
}

function guardStatusTone(status: ReturnType<typeof getGuardUserStatus>): StatusTone {
  switch (status) {
    case 'active':
      return 'positive';
    case 'approved':
      return 'accent';
    case 'pending':
      return 'warning';
    case 'suspended':
    case 'blocked':
      return 'negative';
    default:
      return 'neutral';
  }
}

export function StaffGuardsPanel({
  guards,
  requests,
  standingCrewMembers = [],
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
  onRejectGuardApplication,
  onSetGuardTrusted,
  onMakeCrewLead,
  onDeleteGuard,
  onSubmitIdentityVerification,
  onApproveIdentityVerification,
  onRejectIdentityVerification,
  onRequestIdentityResubmit,
  onRequestCertImageResubmit,
  onReviewGuardInsurance,
  onApproveVehicle,
  onRejectVehicle,
  onUpdateGuardIdImages,
  canVerifyCredentials = false,
  selectedId: controlledSelectedId,
  onSelectedIdChange,
  staffEdit,
  onStaffEditChange,
  staffGuardTab = 'profile',
  onStaffGuardTabChange,
  performanceFactorId = null,
  onPerformanceFactorChange,
  initialSelectedId = null,
  onOpenJob,
  onOpenGuardApplication,
  onOpenGuardCredential,
  onAddGuard,
}: StaffGuardsPanelProps) {
  const { formFactor } = useDevice();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<GuardRosterFilter>('all');
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
    .filter((g) => matchesGuardRosterFilter(g, statusFilter))
    .sort((a, b) => {
      const rank = guardRosterSortRank(a) - guardRosterSortRank(b);
      if (rank !== 0) return rank;
      return a.name.localeCompare(b.name);
    });

  const selectedGuard = selectedId ? roster.find((g) => g.id === selectedId) ?? null : null;

  useEffect(() => {
    if (formFactor === 'mobile') return;
    if (filtered.length === 0) {
      if (selectedId) setSelectedId(null);
      return;
    }
    const stillVisible = selectedId ? filtered.some((g) => g.id === selectedId) : false;
    if (!stillVisible) setSelectedId(filtered[0].id);
  }, [statusFilter, filtered, selectedId, formFactor]);

  const guardColumns: UberTableColumn<SecurityGuard>[] = useMemo(
    () => [
      {
        id: 'guard',
        header: 'Guard',
        grow: true,
        sortValue: (guard) => guard.name.toLowerCase(),
        render: (guard) => (
          <>
            <p className="uber-workbench-table-primary">{guard.name}</p>
            <p className="uber-workbench-table-secondary">{guard.badgeNumber}</p>
          </>
        ),
      },
      {
        id: 'rating',
        header: 'Rating',
        numeric: true,
        align: 'right',
        sortValue: (guard) => guard.rating,
        render: (guard) => `★ ${guard.rating.toFixed(1)}`,
      },
      {
        id: 'job',
        header: 'Current job',
        hideOnNarrow: true,
        render: (guard) => {
          const activeShift = requests.find(
            (r) => r.assignedGuardId === guard.id && (r.status === 'in-progress' || r.status === 'accepted'),
          );
          return activeShift ? activeShift.title : '—';
        },
      },
      {
        id: 'status',
        header: 'Status',
        sortValue: (guard) => getGuardUserStatus(guard),
        render: (guard) => {
          const status = getGuardUserStatus(guard);
          return (
            <StatusChip tone={guardStatusTone(status)}>{GUARD_USER_STATUS_LABELS[status]}</StatusChip>
          );
        },
      },
    ],
    [requests],
  );

  const { showDetailOnly } = useSplitListDetail(selectedId, 'page');

  function buildDetailProps(guard: SecurityGuard) {
    return {
      guard,
      requests,
      canManage,
      canVerifyCredentials,
      canSuspend,
      onUpdateUserStatus,
      onResetAuditFailures,
      onApproveCert,
      onRejectCert,
      onUpdateBackgroundChecked,
      onUpdateProfile: onUpdateProfile ? (payload: ProfileSavePayload) => onUpdateProfile(guard.id, payload) : undefined,
      onAddExperience: onAddExperience ? (exp: Omit<Experience, 'id'>) => onAddExperience(guard.id, exp) : undefined,
      onAddEducation: onAddEducation ? (edu: Omit<GuardEducation, 'id'>) => onAddEducation(guard.id, edu) : undefined,
      onApproveGuardAccount,
      onRejectGuardApplication,
      onSetGuardTrusted: onSetGuardTrusted ? (trusted: boolean) => onSetGuardTrusted(guard.id, trusted) : undefined,
      onMakeCrewLead: onMakeCrewLead ? () => onMakeCrewLead(guard.id) : undefined,
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
      onReviewInsurance: onReviewGuardInsurance
        ? (status, rejectionReason) => onReviewGuardInsurance(guard.id, status, rejectionReason)
        : undefined,
      onApproveVehicle: onApproveVehicle ? () => onApproveVehicle(guard.id) : undefined,
      onRejectVehicle: onRejectVehicle ? (reason) => onRejectVehicle(guard.id, reason) : undefined,
      onOpenJob,
      onOpenGuardApplication,
      onOpenGuardCredential,
      standingCrewMembers,
    };
  }

  const toolbar = !showDetailOnly ? (
    <>
      <div className="staff-ops-cta-stack">
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
      <StaffListFilterTabs
        aria-label="Guard roster status"
        activeId={statusFilter}
        onChange={(id) => setStatusFilter(id as GuardRosterFilter)}
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'pending', label: 'Pending' },
          { id: 'activated', label: 'Approved' },
          { id: 'active', label: 'Active' },
        ]}
      />
    </>
  ) : null;

  if (formFactor === 'desktop') {
    return (
      <WorkbenchPage className="staff-roster-panel">
        {toolbar}
        <WorkbenchPanel padding={false}>
          <WorkbenchSplit
            list={
              filtered.length === 0 ? (
                <WorkbenchEmpty
                  icon={search ? Search : Users}
                  message={search ? 'No guards match your search' : 'No guards on the roster'}
                />
              ) : (
                <UberDataTable
                  columns={guardColumns}
                  rows={filtered}
                  rowKey={(guard) => guard.id}
                  selectedKey={selectedId ?? undefined}
                  onRowClick={(guard) => setSelectedId(guard.id)}
                  caption="Guards"
                  cardLayout={{ title: 'guard', subtitle: 'rating', trailing: 'status' }}
                />
              )
            }
            detail={
              selectedGuard ? (
                <StaffGuardDetailPanel
                  {...buildDetailProps(selectedGuard)}
                  editing={staffEdit}
                  onEditingChange={onStaffEditChange}
                  staffGuardTab={staffGuardTab}
                  onStaffGuardTabChange={onStaffGuardTabChange}
                  performanceFactorId={performanceFactorId}
                  onPerformanceFactorChange={onPerformanceFactorChange}
                />
              ) : (
                <WorkbenchEmpty icon={Users} message="Select a guard to review profile and actions" variant="detail" />
              )
            }
          />
        </WorkbenchPanel>
      </WorkbenchPage>
    );
  }

  return (
    <StaffOpsPageShell toolbar={toolbar} className="staff-roster-panel">
      {filtered.length === 0 ? (
        <div className="app-empty-state app-empty-state--dashed">
          <div className="app-empty-state-icon">
            {roster.length === 0 || !search.trim()
              ? <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              : <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            }
          </div>
          <p className="app-empty-state-title">
            {roster.length === 0
              ? 'No guards on the roster'
              : search.trim()
                ? 'No guards match your search'
                : statusFilter === 'pending'
                  ? 'No pending guards'
                  : statusFilter === 'activated'
                    ? 'No approved guards'
                    : statusFilter === 'active'
                      ? 'No active guards'
                      : 'No guards to show'}
          </p>
          <p className="app-empty-state-body">
            {roster.length === 0
              ? 'Add the first guard profile to get started.'
              : search.trim()
                ? 'Try adjusting your search term.'
                : statusFilter === 'pending'
                  ? 'No guard applications are waiting for approval.'
                  : statusFilter === 'activated'
                    ? 'No approved guard profiles yet.'
                    : statusFilter === 'active'
                      ? 'No guards are currently active.'
                      : 'Try a different status filter.'}
          </p>
        </div>
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

            return (
              <WfListCard
                avatar={<ProfileAvatar src={guard.avatar} name={guard.name} size="sm" rounded="lg" />}
                title={guard.name}
                subtitle={`${guard.badgeNumber} · ★ ${guard.rating}`}
                meta={
                  <div className="flex flex-col items-start gap-1.5 w-full">
                    <GuardRosterStatusBadges guard={guard} />
                    {activeShift && (
                      <p className="text-[11px] text-brand-text-muted truncate max-w-full">
                        On job: {activeShift.title}
                      </p>
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
              staffGuardTab={staffGuardTab}
              onStaffGuardTabChange={onStaffGuardTabChange}
              performanceFactorId={performanceFactorId}
              onPerformanceFactorChange={onPerformanceFactorChange}
              onBack={options?.onBack}
            />
          )}
          mobilePresentation="page"
        />
      )}
    </StaffOpsPageShell>
  );
}
