import React, { useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { getGuardDisplayStatus, GUARD_STATUS_LABELS } from '../../lib/guardQualification';
import { useDevice } from '../../lib/platform';
import { StaffGuardDetailPanel } from './StaffGuardDetailPanel';
import { Search, Shield } from 'lucide-react';

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

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {!showDetailOnly && (
        <>
          <div>
            <h1 className="text-2xl font-black">Guards</h1>
            <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase">
              {filter === 'staff'
                ? 'Guardr staff accounts — platform operations only, not field shifts'
                : 'Click a guard to open their profile and verify credentials'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['field', 'staff'] as GuardFilter[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setFilter(tab);
                  setSelectedId(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase border transition-colors ${
                  filter === tab
                    ? 'bg-brand-primary text-black border-brand-primary'
                    : 'border-brand-border text-brand-text-muted hover:text-brand-text'
                }`}
              >
                {tab === 'field' ? 'Field Guards' : 'Staff Team'}
              </button>
            ))}
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
            <input
              type="text"
              placeholder="Search guards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="uber-input pl-10 w-full"
            />
          </div>
        </>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-brand-text-muted font-mono py-12 text-center border border-dashed border-brand-border rounded-xl">
          {filter === 'staff' ? 'No staff accounts on file.' : 'No field guards match your search.'}
        </p>
      ) : showDetailOnly && detailProps ? (
        <StaffGuardDetailPanel {...detailProps} onBack={() => setSelectedId(null)} />
      ) : splitView ? (
        <div className="tablet-split-panel">
          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {filtered.map((guard) => {
              const activeShift = requests.find(
                (r) => r.assignedGuardId === guard.id && (r.status === 'in-progress' || r.status === 'accepted')
              );
              const accountStatus = guard.userStatus || 'active';
              const isActive = selected?.id === guard.id;
              const pendingCerts = guard.certifications.filter((c) => c.status === 'pending').length;

              return (
                <button
                  key={guard.id}
                  type="button"
                  onClick={() => setSelectedId(guard.id)}
                  className={`w-full text-left staff-ops-card p-3 transition-colors ${
                    isActive ? 'ring-2 ring-brand-primary' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={guard.avatar}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-sm truncate">{guard.name}</p>
                        {pendingCerts > 0 && (
                          <span className="text-[9px] font-mono bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                            {pendingCerts} pending
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-brand-text-muted truncate">
                        {guard.badgeNumber} · ★ {guard.rating}
                      </p>
                      {!guard.isStaff && (
                        <p className="text-[10px] font-mono text-brand-text-muted mt-0.5">
                          {GUARD_STATUS_LABELS[getGuardDisplayStatus(guard)]} · {GUARD_STATUS_LABELS[accountStatus]}
                        </p>
                      )}
                      {guard.isStaff && (
                        <span className="text-[9px] font-mono text-brand-primary flex items-center gap-1 mt-0.5">
                          <Shield className="w-2.5 h-2.5" /> {guard.staffRole || 'Staff'}
                        </span>
                      )}
                      {!guard.isStaff && activeShift && (
                        <p className="text-[10px] text-brand-text-muted truncate mt-0.5">On: {activeShift.title}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {detailProps && <StaffGuardDetailPanel {...detailProps} />}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((guard) => {
            const pendingCerts = guard.certifications.filter((c) => c.status === 'pending').length;
            return (
              <button
                key={guard.id}
                type="button"
                onClick={() => setSelectedId(guard.id)}
                className="w-full text-left staff-ops-card p-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={guard.avatar} alt="" className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                    <div className="min-w-0">
                      <p className="font-black text-sm truncate">{guard.name}</p>
                      <p className="text-[10px] font-mono text-brand-text-muted">{guard.badgeNumber}</p>
                    </div>
                  </div>
                  {pendingCerts > 0 && (
                    <span className="text-[9px] font-mono text-amber-400 shrink-0">{pendingCerts} to verify</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
