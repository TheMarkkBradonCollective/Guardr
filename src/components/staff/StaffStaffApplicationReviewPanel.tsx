import React, { useState } from 'react';
import { SecurityGuard } from '../../types';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { Mail, Phone } from 'lucide-react';
import { getGuardUserStatus } from '../../lib/accountStatus';
import { getStaffRosterStatusLabel } from '../../lib/staffAccountActivation';
import { ROLE_LABELS, staffRoleToPlatformRole } from '../../lib/permissions';
import { StaffStaffApplicationSummary } from './StaffStaffApplicationSummary';
import { showAppToast } from '../ui/AppToast';
import {
  confirmApproveStaffAccount,
  confirmRejectStaffAccount,
} from '../../lib/importantActionConfirm';

interface StaffStaffApplicationReviewPanelProps {
  member: SecurityGuard;
  canReview: boolean;
  onApproveStaffAccount?: (staffId: string) => void | Promise<void>;
  onRejectStaffAccount?: (staffId: string) => void | Promise<void>;
  onOpenStaffProfile?: (staffId: string) => void;
}

export function StaffStaffApplicationReviewPanel({
  member,
  canReview,
  onApproveStaffAccount,
  onRejectStaffAccount,
  onOpenStaffProfile,
}: StaffStaffApplicationReviewPanelProps) {
  const [actionPending, setActionPending] = useState(false);
  const accountStatus = getGuardUserStatus(member);
  const isPending = accountStatus === 'pending';
  const displayName = member.badgeNumber || member.name;
  const staffRole = member.staffRole || 'Support';
  const statusTone =
    isPending
      ? 'warning'
      : accountStatus === 'suspended' || accountStatus === 'blocked'
        ? 'danger'
        : accountStatus === 'active'
          ? 'success'
          : 'default';
  const statusLabel = getStaffRosterStatusLabel(member);

  const handleApprove = async () => {
    if (!onApproveStaffAccount) return;
    if (!(await confirmApproveStaffAccount(displayName))) return;
    setActionPending(true);
    try {
      await onApproveStaffAccount(member.id);
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not approve staff account.', {
        tone: 'error',
      });
    } finally {
      setActionPending(false);
    }
  };

  const handleReject = async () => {
    if (!onRejectStaffAccount) return;
    if (!(await confirmRejectStaffAccount(displayName))) return;
    setActionPending(true);
    try {
      await onRejectStaffAccount(member.id);
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not reject staff account.', {
        tone: 'error',
      });
    } finally {
      setActionPending(false);
    }
  };

  return (
    <div className="staff-detail-pane space-y-4">
      <div className="flex items-start gap-4 pb-4 border-b border-brand-border">
        <ProfileAvatar src={member.avatar} name={displayName} size="lg" rounded="xl" />
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-lg">{displayName}</h2>
          {member.name && member.name !== displayName && (
            <p className="text-sm text-brand-text-muted">{member.name}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-brand-text-muted">
            <span className="inline-flex items-center gap-1">
              <Mail className="w-4 h-4" />
              {member.email}
            </span>
            {member.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {member.phone}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <WfBadge tone="primary">
              {staffRole} — {ROLE_LABELS[staffRoleToPlatformRole(staffRole)]}
            </WfBadge>
            <WfBadge tone={statusTone}>{statusLabel}</WfBadge>
          </div>
        </div>
      </div>

      {onOpenStaffProfile && (
        <button
          type="button"
          onClick={() => onOpenStaffProfile(member.id)}
          className="text-xs font-semibold text-brand-primary hover:underline"
        >
          View full staff profile →
        </button>
      )}

      <StaffStaffApplicationSummary member={member} />

      {canReview && isPending && (onApproveStaffAccount || onRejectStaffAccount) && (
        <section className="staff-detail-section space-y-3">
          <WfSectionHeader title="Review actions" className="!px-0 !mb-0" />
          <div className="staff-detail-actions">
            {onApproveStaffAccount && (
              <button
                type="button"
                onClick={() => void handleApprove()}
                disabled={actionPending}
                className="app-button-primary app-btn-sm disabled:opacity-50"
              >
                Approve application
              </button>
            )}
            {onRejectStaffAccount && (
              <button
                type="button"
                onClick={() => void handleReject()}
                disabled={actionPending}
                className="app-button-outline app-btn-sm text-red-400 border-red-500/40 disabled:opacity-50"
              >
                Deny application
              </button>
            )}
          </div>
        </section>
      )}

      {canReview && isPending && !onApproveStaffAccount && !onRejectStaffAccount && (
        <p className="text-sm text-brand-text-muted">
          Only Directors and Founders can approve or deny staff applications.
        </p>
      )}
    </div>
  );
}
