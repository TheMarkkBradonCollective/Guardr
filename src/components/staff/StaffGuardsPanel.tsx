import React, { useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { Search } from 'lucide-react';

interface StaffGuardsPanelProps {
  guards: SecurityGuard[];
  requests: SecurityRequest[];
  canSuspend: boolean;
  onApproveGuard: (id: string) => void;
  onUpdateUserStatus: (id: string, status: 'active' | 'suspended' | 'blocked') => void;
  onResetAuditFailures?: (id: string) => void;
}

export function StaffGuardsPanel({
  guards,
  requests,
  canSuspend,
  onApproveGuard,
  onUpdateUserStatus,
  onResetAuditFailures,
}: StaffGuardsPanelProps) {
  const [search, setSearch] = useState('');
  const fieldGuards = guards.filter((g) => !g.isStaff);

  const filtered = fieldGuards.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase()) ||
      g.badgeNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Guards</h1>
        <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase">Monitor guard performance and account status</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
        <input type="text" placeholder="Search guards..." value={search} onChange={(e) => setSearch(e.target.value)} className="uber-input pl-10 w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((guard) => {
          const activeShift = requests.find(
            (r) => r.assignedGuardId === guard.id && (r.status === 'in-progress' || r.status === 'accepted')
          );
          const status = guard.userStatus || 'active';

          return (
            <div key={guard.id} className="staff-ops-card space-y-3">
              <div className="flex items-start gap-3">
                <img src={guard.avatar} alt={guard.name} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-sm">{guard.name}</h3>
                    {guard.verified ? (
                      <span className="text-[9px] font-mono text-emerald-400">Verified</span>
                    ) : (
                      <span className="text-[9px] font-mono text-amber-400">Pending</span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-brand-text-muted">{guard.badgeNumber} · ★ {guard.rating} · {guard.jobsCompleted} jobs</p>
                  <p className="text-xs text-brand-text-muted mt-1 truncate">
                    {activeShift ? `On assignment: ${activeShift.title}` : 'No active shift'}
                  </p>
                  <p className="text-[10px] font-mono text-brand-text-muted mt-1">
                    Violations: {guard.failedAudits ?? 0}/3 · Status: {status}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-brand-border">
                {!guard.verified && (
                  <button type="button" onClick={() => onApproveGuard(guard.id)} className="staff-ops-btn-primary text-[9px] py-1.5">Approve</button>
                )}
                {canSuspend && status !== 'suspended' && (
                  <button type="button" onClick={() => onUpdateUserStatus(guard.id, 'suspended')} className="staff-ops-btn-outline text-[9px] py-1.5">Suspend</button>
                )}
                {canSuspend && status !== 'blocked' && (
                  <button type="button" onClick={() => onUpdateUserStatus(guard.id, 'blocked')} className="staff-ops-btn-danger text-[9px] py-1.5">Flag</button>
                )}
                {canSuspend && status !== 'active' && (
                  <button type="button" onClick={() => onUpdateUserStatus(guard.id, 'active')} className="staff-ops-btn-outline text-[9px] py-1.5">Restore</button>
                )}
                {(guard.failedAudits ?? 0) > 0 && onResetAuditFailures && (
                  <button type="button" onClick={() => onResetAuditFailures(guard.id)} className="staff-ops-btn-outline text-[9px] py-1.5">Clear Violations</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
