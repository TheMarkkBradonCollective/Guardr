import React, { useMemo } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { certDisplayName } from '../../lib/certCatalog';
import { groupGuardCertsByCategory } from '../../lib/certMatching';
import {
  getGuardDisplayStatus,
  getQualificationProgress,
  GUARD_STATUS_LABELS,
  guardPathwayStatusLabel,
} from '../../lib/guardQualification';
import { CredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { CertBadgeRow } from '../guard/CertBadgeRow';
import { formatShiftRange } from '../../lib/dates';
import { formatStateName } from '../../lib/states';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { ArrowLeft, Check, X } from 'lucide-react';

interface StaffGuardDetailPanelProps {
  guard: SecurityGuard;
  requests: SecurityRequest[];
  canSuspend: boolean;
  onUpdateUserStatus: (id: string, status: 'active' | 'suspended' | 'blocked') => void;
  onResetAuditFailures?: (id: string) => void;
  onApproveCert: (guardId: string, certId: string) => void;
  onRejectCert: (guardId: string, certId: string) => void;
  onApproveGuard?: (guardId: string) => void;
  onRejectGuard?: (guardId: string) => void;
  onUpdateBackgroundChecked?: (guardId: string, checked: boolean) => void;
  onBack?: () => void;
  compact?: boolean;
}

export function StaffGuardDetailPanel({
  guard,
  requests,
  canSuspend,
  onUpdateUserStatus,
  onResetAuditFailures,
  onApproveCert,
  onRejectCert,
  onApproveGuard,
  onRejectGuard,
  onUpdateBackgroundChecked,
  onBack,
  compact = false,
}: StaffGuardDetailPanelProps) {
  const accountStatus = guard.userStatus || 'active';
  const pathwayStatus = getGuardDisplayStatus(guard);
  const progress = getQualificationProgress(guard);
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
    const flat = Object.values(groupedCerts).flat();
    return flat
      .filter((c) => c.status !== 'rejected')
      .sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return a.name.localeCompare(b.name);
      });
  }, [groupedCerts]);

  const pendingCount = allCerts.filter((c) => c.status === 'pending').length;

  return (
    <div className={`staff-ops-card space-y-5 ${compact ? '' : 'h-full'}`}>
      {onBack && (
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-xs font-mono text-brand-primary">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to list
        </button>
      )}

      <div className="flex items-start gap-4">
        <ProfileAvatar src={guard.avatar} name={guard.name} size="lg" rounded="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-black text-lg">{guard.name}</h2>
            {guard.isStaff && (
              <span className="text-[9px] font-mono text-brand-primary border border-brand-primary/30 px-1.5 py-0.5 rounded">
                {guard.staffRole || 'Staff'}
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-brand-text-muted mt-1">{guard.email}</p>
          <p className="text-xs font-mono text-brand-text-muted">
            {guard.badgeNumber} · ★ {guard.rating} · {guard.jobsCompleted} jobs
          </p>
          {!guard.isStaff && (
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-brand-primary/30 text-brand-primary">
                {GUARD_STATUS_LABELS[pathwayStatus]}
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-brand-border text-brand-text-muted">
                Account: {GUARD_STATUS_LABELS[accountStatus]}
              </span>
              {guard.verified && (
                <span className="text-[10px] font-mono text-emerald-400">Guardr verified</span>
              )}
              {guard.backgroundChecked && (
                <span className="text-[10px] font-mono text-brand-primary">Background checked</span>
              )}
            </div>
          )}
        </div>
      </div>

      {!guard.isStaff && (
        <>
          <section className="space-y-2 border-t border-brand-border pt-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted">Qualification</p>
            <p className="text-sm">
              Pathway: <strong>{guardPathwayStatusLabel(progress.level)}</strong>
            </p>
            <CertBadgeRow guard={guard} showCaBaseline />
          </section>

          <section className="space-y-2 border-t border-brand-border pt-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted">Account controls</p>
            <div className="flex flex-wrap gap-2">
              {canSuspend && accountStatus !== 'suspended' && (
                <button type="button" onClick={() => onUpdateUserStatus(guard.id, 'suspended')} className="staff-ops-btn-outline text-[10px]">
                  Suspend
                </button>
              )}
              {canSuspend && accountStatus !== 'blocked' && (
                <button type="button" onClick={() => onUpdateUserStatus(guard.id, 'blocked')} className="staff-ops-btn-danger text-[10px]">
                  Flag / Block
                </button>
              )}
              {canSuspend && accountStatus !== 'active' && (
                <button type="button" onClick={() => onUpdateUserStatus(guard.id, 'active')} className="staff-ops-btn-primary text-[10px]">
                  Restore account
                </button>
              )}
              {(guard.failedAudits ?? 0) > 0 && onResetAuditFailures && (
                <button type="button" onClick={() => onResetAuditFailures(guard.id)} className="staff-ops-btn-outline text-[10px]">
                  Clear violations ({guard.failedAudits}/3)
                </button>
              )}
              {onUpdateBackgroundChecked && (
                <button
                  type="button"
                  onClick={() => onUpdateBackgroundChecked(guard.id, !guard.backgroundChecked)}
                  className="staff-ops-btn-outline text-[10px]"
                >
                  {guard.backgroundChecked ? 'Clear background check' : 'Mark background checked'}
                </button>
              )}
              {onApproveGuard && !guard.verified && (
                <button type="button" onClick={() => onApproveGuard(guard.id)} className="staff-ops-btn-primary text-[10px]">
                  Verify guard profile
                </button>
              )}
              {onRejectGuard && guard.verified && (
                <button type="button" onClick={() => onRejectGuard(guard.id)} className="staff-ops-btn-outline text-[10px]">
                  Remove profile verification
                </button>
              )}
            </div>
          </section>

          <section className="space-y-3 border-t border-brand-border pt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted">
                Credentials {pendingCount > 0 ? `· ${pendingCount} pending` : ''}
              </p>
            </div>
            {allCerts.length === 0 ? (
              <p className="text-xs text-brand-text-muted font-mono">No credentials on file.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {allCerts.map((cert) => (
                  <div key={cert.id} className="rounded-lg border border-brand-border p-3 flex flex-col sm:flex-row gap-3 justify-between">
                    <div className="flex gap-3 min-w-0">
                      {cert.imageUrl && (
                        <img
                          src={cert.imageUrl}
                          alt=""
                          className="w-14 h-14 rounded-lg object-cover border border-brand-border shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{certDisplayName(cert)}</p>
                        <p className="text-[10px] font-mono text-brand-text-muted mt-0.5">
                          {cert.state ? `${formatStateName(cert.state)} · ` : ''}
                          {cert.issuer} · #{cert.number}
                        </p>
                        <p className="text-[10px] text-brand-text-muted mt-0.5">
                          Expires {cert.expiryDate || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <CredentialStatusBadges cert={cert} />
                      {cert.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => onRejectCert(guard.id, cert.id)}
                            className="staff-ops-btn-danger text-[9px] py-1"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => onApproveCert(guard.id, cert.id)}
                            className="staff-ops-btn-primary text-[9px] py-1"
                          >
                            <Check className="w-3 h-3" /> Verify
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2 border-t border-brand-border pt-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted">Recent assignments</p>
            {guardJobs.length === 0 ? (
              <p className="text-xs text-brand-text-muted font-mono">No assignments on record.</p>
            ) : (
              <div className="space-y-2">
                {guardJobs.map((job) => (
                  <div key={job.id} className="rounded-lg border border-brand-border/60 px-3 py-2">
                    <p className="text-sm font-semibold truncate">{job.title}</p>
                    <p className="text-[10px] font-mono text-brand-text-muted">
                      {job.clientName} · {job.status.replace('-', ' ')}
                    </p>
                    <p className="text-[10px] text-brand-text-muted">{formatShiftRange(job.startDate, job.endDate)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {guard.isStaff && (
        <section className="border-t border-brand-border pt-4">
          <p className="text-xs text-brand-text-muted font-mono">
            Staff platform account — field credential verification does not apply.
          </p>
          {guard.phone && <p className="text-sm mt-2">{guard.phone}</p>}
        </section>
      )}

      {guard.bio && !guard.isStaff && (
        <section className="border-t border-brand-border pt-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted mb-2">Bio</p>
          <p className="text-sm text-brand-text-muted leading-relaxed">{guard.bio}</p>
        </section>
      )}
    </div>
  );
}
