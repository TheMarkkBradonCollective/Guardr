import React, { useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { getGuardDisplayStatus, GUARD_STATUS_LABELS } from '../../lib/guardQualification';
import { useDevice } from '../../lib/platform';
import { StaffGuardDetailPanel } from './StaffGuardDetailPanel';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
import { StaffAddGuardForm } from './StaffAddGuardForm';

interface StaffGuardsPanelProps {
  guards: SecurityGuard[];
  requests: SecurityRequest[];
  canSuspend: boolean;
  onUpdateUserStatus: (id: string, status: 'active' | 'suspended' | 'blocked') => void;
  onResetAuditFailures?: (id: string) => void;
  onApproveCert: (guardId: string, certId: string) => void;
  onRejectCert: (guardId: string, certId: string) => void;
  onApproveGuard?: (guardId: string) => void;
  onRejectGuard?: (guardId: string) => void;
  onUpdateBackgroundChecked?: (guardId: string, checked: boolean) => void;
  initialSelectedId?: string | null;
  onOpenJob?: (jobId: string) => void;
  onAddGuard?: (input: {
    name: string;
    email: string;
    phone?: string;
    badgeNumber?: string;
    hourlyRate?: number;
  }) => Promise<string>;
}

export function StaffGuardsPanel({
  guards,
  requests,
  canSuspend,
  onUpdateUserStatus,
  onResetAuditFailures,
  onApproveCert,
  onRejectCert,
  onApproveGuard,
  onRejectGuard,
  onUpdateBackgroundChecked,
  initialSelectedId = null,
  onOpenJob,
  onAddGuard,
}: StaffGuardsPanelProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
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
        canSuspend,
        onUpdateUserStatus,
        onResetAuditFailures,
        onApproveCert,
        onRejectCert,
        onApproveGuard,
        onRejectGuard,
        onUpdateBackgroundChecked,
        onOpenJob,
      }
    : null;

  function renderGuardCard(guard: SecurityGuard, isActive: boolean) {
    const activeShift = requests.find(
      (r) => r.assignedGuardId === guard.id && (r.status === 'in-progress' || r.status === 'accepted')
    );
    const accountStatus = guard.userStatus || 'active';
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
            <span>
              {GUARD_STATUS_LABELS[getGuardDisplayStatus(guard)]} · {GUARD_STATUS_LABELS[accountStatus]}
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
              Field guards who accept shifts — click a profile to verify credentials and manage their account.
            </p>
            {onAddGuard && (
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
        <StaffGuardDetailPanel {...detailProps} onBack={() => setSelectedId(null)} />
      ) : splitView ? (
        <div className="tablet-split-panel">
          <div className="max-h-[75vh] overflow-y-auto pr-1">
            <AppItemCardStack>
              {filtered.map((guard) => renderGuardCard(guard, selected?.id === guard.id))}
            </AppItemCardStack>
          </div>
          {detailProps && <StaffGuardDetailPanel {...detailProps} />}
        </div>
      ) : (
        <AppItemCardStack>
          {filtered.map((guard) => renderGuardCard(guard, false))}
        </AppItemCardStack>
      )}
    </div>
  );
}
