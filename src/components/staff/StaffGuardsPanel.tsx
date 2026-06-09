import React, { useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { getGuardDisplayStatus, GUARD_STATUS_LABELS } from '../../lib/guardQualification';
import { useDevice } from '../../lib/platform';
import { StaffGuardDetailPanel } from './StaffGuardDetailPanel';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppList } from '../ui/app/AppPrimitives';
import { WfBadge, WfListCard, WfSearchBar } from '../ui/wireframe';
import { Shield } from 'lucide-react';

type GuardFilter = 'field' | 'staff';

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
}: StaffGuardsPanelProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<GuardFilter>('field');
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const { formFactor } = useDevice();
  const splitView = formFactor === 'tablet' || formFactor === 'desktop';

  const roster = guards.filter((g) => (filter === 'staff' ? g.isStaff : !g.isStaff));

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
            {!guard.isStaff && (
              <span>
                {GUARD_STATUS_LABELS[getGuardDisplayStatus(guard)]} · {GUARD_STATUS_LABELS[accountStatus]}
              </span>
            )}
            {guard.isStaff && (
              <span className="text-brand-primary flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" /> {guard.staffRole || 'Staff'}
              </span>
            )}
            {!guard.isStaff && activeShift && (
              <span>On: {activeShift.title}</span>
            )}
          </div>
        }
        onClick={() => setSelectedId(guard.id)}
        className={isActive ? 'ring-2 ring-brand-primary' : ''}
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      {!showDetailOnly && (
        <>
          <p className="text-sm text-brand-text-muted">
            {filter === 'staff'
              ? 'Guardr staff accounts — platform operations only, not field shifts'
              : 'Click a guard to open their profile and verify credentials'}
          </p>

          <div className="flex flex-wrap gap-2">
            {(['field', 'staff'] as GuardFilter[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setFilter(tab);
                  setSelectedId(null);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  filter === tab
                    ? 'bg-brand-primary text-brand-accent-text border-brand-primary'
                    : 'border-brand-border text-brand-text-muted hover:text-brand-text'
                }`}
              >
                {tab === 'field' ? 'Field Guards' : 'Staff Team'}
              </button>
            ))}
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
          {filter === 'staff' ? 'No staff accounts on file.' : 'No field guards match your search.'}
        </p>
      ) : showDetailOnly && detailProps ? (
        <StaffGuardDetailPanel {...detailProps} onBack={() => setSelectedId(null)} />
      ) : splitView ? (
        <div className="tablet-split-panel">
          <div className="max-h-[75vh] overflow-y-auto">
            <AppList>
              {filtered.map((guard) => renderGuardCard(guard, selected?.id === guard.id))}
            </AppList>
          </div>
          {detailProps && <StaffGuardDetailPanel {...detailProps} />}
        </div>
      ) : (
        <AppList>
          {filtered.map((guard) => renderGuardCard(guard, false))}
        </AppList>
      )}
    </div>
  );
}
