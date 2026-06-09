import React, { useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { getGuardQualificationLevel, QUALIFICATION_LEVEL_LABELS } from '../../lib/guardQualification';
import { Search, Shield } from 'lucide-react';

type GuardFilter = 'field' | 'staff';

interface StaffGuardsPanelProps {
  guards: SecurityGuard[];
  requests: SecurityRequest[];
  canSuspend: boolean;
  canToggleStaff: boolean;
  onUpdateUserStatus: (id: string, status: 'active' | 'suspended' | 'blocked') => void;
  onUpdateStaffStatus: (id: string, isStaff: boolean) => void | Promise<void>;
  onResetAuditFailures?: (id: string) => void;
}

export function StaffGuardsPanel({
  guards,
  requests,
  canSuspend,
  canToggleStaff,
  onUpdateUserStatus,
  onUpdateStaffStatus,
  onResetAuditFailures,
}: StaffGuardsPanelProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<GuardFilter>('field');
  const [actioningId, setActioningId] = useState<string | null>(null);

  const roster = guards.filter((g) => (filter === 'staff' ? g.isStaff : !g.isStaff));

  const filtered = roster.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase()) ||
      g.badgeNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleStaff = async (guard: SecurityGuard) => {
    if (!canToggleStaff) return;
    setActioningId(guard.id);
    try {
      await onUpdateStaffStatus(guard.id, !guard.isStaff);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Guards</h1>
        <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase">
          {filter === 'staff' ? 'Staff team roster and roles' : 'Monitor guard performance and account status'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['field', 'staff'] as GuardFilter[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
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
        <input type="text" placeholder="Search guards..." value={search} onChange={(e) => setSearch(e.target.value)} className="uber-input pl-10 w-full" />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-brand-text-muted font-mono py-12 text-center border border-dashed border-brand-border rounded-xl">
          {filter === 'staff' ? 'No staff accounts on file.' : 'No field guards match your search.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((guard) => {
            const activeShift = requests.find(
              (r) => r.assignedGuardId === guard.id && (r.status === 'in-progress' || r.status === 'accepted')
            );
            const status = guard.userStatus || 'active';
            const isBusy = actioningId === guard.id;

            return (
              <div key={guard.id} className="staff-ops-card space-y-3">
                <div className="flex items-start gap-3">
                  <img src={guard.avatar} alt={guard.name} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-sm">{guard.name}</h3>
                      {guard.isStaff ? (
                        <span className="text-[9px] font-mono text-brand-primary flex items-center gap-1 border border-brand-primary/30 px-1.5 py-0.5 rounded">
                          <Shield className="w-2.5 h-2.5" /> {guard.staffRole || 'Staff'}
                        </span>
                      ) : (() => {
                        const level = getGuardQualificationLevel(guard);
                        return (
                          <span className={`text-[9px] font-mono ${level === 'active' ? 'text-emerald-400' : level === 'pending' ? 'text-brand-primary' : 'text-amber-400'}`}>
                            {level === 'none' ? 'No credentials' : QUALIFICATION_LEVEL_LABELS[level]}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-[10px] font-mono text-brand-text-muted">{guard.badgeNumber} · ★ {guard.rating} · {guard.jobsCompleted} jobs</p>
                    <p className="text-xs text-brand-text-muted mt-1 truncate">
                      {activeShift ? `On assignment: ${activeShift.title}` : guard.isStaff ? guard.email : 'No active shift'}
                    </p>
                    {!guard.isStaff && (
                      <p className="text-[10px] font-mono text-brand-text-muted mt-1">
                        Violations: {guard.failedAudits ?? 0}/3 · Status: {status}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-brand-border">
                  {!guard.isStaff && canSuspend && status !== 'suspended' && (
                    <button type="button" onClick={() => onUpdateUserStatus(guard.id, 'suspended')} className="staff-ops-btn-outline text-[9px] py-1.5">Suspend</button>
                  )}
                  {!guard.isStaff && canSuspend && status !== 'blocked' && (
                    <button type="button" onClick={() => onUpdateUserStatus(guard.id, 'blocked')} className="staff-ops-btn-danger text-[9px] py-1.5">Flag</button>
                  )}
                  {!guard.isStaff && canSuspend && status !== 'active' && (
                    <button type="button" onClick={() => onUpdateUserStatus(guard.id, 'active')} className="staff-ops-btn-outline text-[9px] py-1.5">Restore</button>
                  )}
                  {!guard.isStaff && (guard.failedAudits ?? 0) > 0 && onResetAuditFailures && (
                    <button type="button" onClick={() => onResetAuditFailures(guard.id)} className="staff-ops-btn-outline text-[9px] py-1.5">Clear Violations</button>
                  )}
                  {canToggleStaff && !guard.isStaff && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleStaff(guard)}
                      className="staff-ops-btn-outline text-[9px] py-1.5"
                    >
                      {isBusy ? 'Updating…' : 'Promote to Staff'}
                    </button>
                  )}
                  {canToggleStaff && guard.isStaff && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleStaff(guard)}
                      className="staff-ops-btn-danger text-[9px] py-1.5"
                    >
                      {isBusy ? 'Updating…' : 'Remove Staff Access'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
