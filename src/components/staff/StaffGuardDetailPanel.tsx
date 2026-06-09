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
import { WfBadge, WfMetricTile, WfSectionHeader } from '../ui/wireframe';
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
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-brand-primary">
          <ArrowLeft className="w-4 h-4" />
          Back to list
        </button>
      )}

      <div className="flex items-start gap-4">
        <ProfileAvatar src={guard.avatar} name={guard.name} size="lg" rounded="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold text-lg">{guard.name}</h2>
            {guard.isStaff && (
              <WfBadge tone="primary">{guard.staffRole || 'Staff'}</WfBadge>
            )}
          </div>
          <p className="text-sm text-brand-text-muted mt-1">{guard.email}</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <WfMetricTile label="Badge" value={guard.badgeNumber} />
            <WfMetricTile label="Rating" value={`★ ${guard.rating}`} accent />
            <WfMetricTile label="Jobs" value={guard.jobsCompleted} />
          </div>
          {!guard.isStaff && (
            <div className="flex flex-wrap gap-2 mt-3">
              <WfBadge tone="primary">{GUARD_STATUS_LABELS[pathwayStatus]}</WfBadge>
              <WfBadge>Account: {GUARD_STATUS_LABELS[accountStatus]}</WfBadge>
              {guard.verified && (
                <WfBadge tone="success">Guardr verified</WfBadge>
              )}
              {guard.backgroundChecked && (
                <WfBadge tone="primary">Background checked</WfBadge>
              )}
            </div>
          )}
        </div>
      </div>

      {!guard.isStaff && (
        <>
          <section className="space-y-2 border-t border-brand-border pt-4">
            <WfSectionHeader title="Qualification" className="mb-0" />
            <p className="text-sm">
              Pathway: <strong>{guardPathwayStatusLabel(progress.level)}</strong>
            </p>
            <CertBadgeRow guard={guard} showCaBaseline />
          </section>

          <section className="space-y-2 border-t border-brand-border pt-4">
            <WfSectionHeader title="Account controls" className="mb-0" />
            <div className="flex flex-wrap gap-2">
              {canSuspend && accountStatus !== 'suspended' && (
                <button type="button" onClick={() => onUpdateUserStatus(guard.id, 'suspended')} className="app-button-outline !w-auto !h-9 !px-4 !text-xs">
                  Suspend
                </button>
              )}
              {canSuspend && accountStatus !== 'blocked' && (
                <button type="button" onClick={() => onUpdateUserStatus(guard.id, 'blocked')} className="app-button-outline !w-auto !h-9 !px-4 !text-xs text-red-400 border-red-500/40">
                  Flag / Block
                </button>
              )}
              {canSuspend && accountStatus !== 'active' && (
                <button type="button" onClick={() => onUpdateUserStatus(guard.id, 'active')} className="app-button-primary !w-auto !h-9 !px-4 !text-xs">
                  Restore account
                </button>
              )}
              {(guard.failedAudits ?? 0) > 0 && onResetAuditFailures && (
                <button type="button" onClick={() => onResetAuditFailures(guard.id)} className="app-button-outline !w-auto !h-9 !px-4 !text-xs">
                  Clear violations ({guard.failedAudits}/3)
                </button>
              )}
              {onUpdateBackgroundChecked && (
                <button
                  type="button"
                  onClick={() => onUpdateBackgroundChecked(guard.id, !guard.backgroundChecked)}
                  className="app-button-outline !w-auto !h-9 !px-4 !text-xs"
                >
                  {guard.backgroundChecked ? 'Clear background check' : 'Mark background checked'}
                </button>
              )}
              {onApproveGuard && !guard.verified && (
                <button type="button" onClick={() => onApproveGuard(guard.id)} className="app-button-primary !w-auto !h-9 !px-4 !text-xs">
                  Verify guard profile
                </button>
              )}
              {onRejectGuard && guard.verified && (
                <button type="button" onClick={() => onRejectGuard(guard.id)} className="app-button-outline !w-auto !h-9 !px-4 !text-xs">
                  Remove profile verification
                </button>
              )}
            </div>
          </section>

          <section className="space-y-3 border-t border-brand-border pt-4">
            <WfSectionHeader
              title="Credentials"
              count={pendingCount > 0 ? pendingCount : undefined}
              className="mb-0"
            />
            {allCerts.length === 0 ? (
              <p className="text-sm text-brand-text-muted">No credentials on file.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {allCerts.map((cert) => (
                  <div key={cert.id} className="wf-list-card flex-col items-stretch !flex !flex-col sm:!flex-row gap-3">
                    <div className="flex gap-3 min-w-0 flex-1">
                      {cert.imageUrl && (
                        <img
                          src={cert.imageUrl}
                          alt=""
                          className="w-14 h-14 rounded-lg object-cover border border-brand-border shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{certDisplayName(cert)}</p>
                        <p className="text-xs text-brand-text-muted mt-0.5">
                          {cert.state ? `${formatStateName(cert.state)} · ` : ''}
                          {cert.issuer} · #{cert.number}
                        </p>
                        <p className="text-xs text-brand-text-muted mt-0.5">
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
                            className="app-button-outline !w-auto !h-8 !px-3 !text-xs text-red-400 border-red-500/40 gap-1"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => onApproveCert(guard.id, cert.id)}
                            className="app-button-primary !w-auto !h-8 !px-3 !text-xs gap-1"
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
            <WfSectionHeader title="Recent assignments" className="mb-0" />
            {guardJobs.length === 0 ? (
              <p className="text-sm text-brand-text-muted">No assignments on record.</p>
            ) : (
              <div className="space-y-2">
                {guardJobs.map((job) => (
                  <div key={job.id} className="wf-list-card flex-col items-stretch !flex !flex-col gap-1">
                    <p className="text-sm font-semibold truncate">{job.title}</p>
                    <p className="text-xs text-brand-text-muted">
                      {job.clientName} · {job.status.replace('-', ' ')}
                    </p>
                    <p className="text-xs text-brand-text-muted">{formatShiftRange(job.startDate, job.endDate)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {guard.isStaff && (
        <section className="border-t border-brand-border pt-4">
          <p className="text-sm text-brand-text-muted">
            Staff platform account — field credential verification does not apply.
          </p>
          {guard.phone && <p className="text-sm mt-2">{guard.phone}</p>}
        </section>
      )}

      {guard.bio && !guard.isStaff && (
        <section className="border-t border-brand-border pt-4">
          <WfSectionHeader title="Bio" className="mb-2" />
          <p className="text-sm text-brand-text-muted leading-relaxed">{guard.bio}</p>
        </section>
      )}
    </div>
  );
}
