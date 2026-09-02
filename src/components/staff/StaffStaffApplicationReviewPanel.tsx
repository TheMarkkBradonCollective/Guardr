import React, { useState } from 'react';
import { SecurityGuard } from '../../types';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { AppButton } from '../ui/AppButton';
import { getGuardUserStatus } from '../../lib/accountStatus';
import { getStaffRosterStatusLabel } from '../../lib/staffAccountActivation';
import { ROLE_LABELS, staffRoleToPlatformRole } from '../../lib/permissions';
import { StaffStaffApplicationSummary } from './StaffStaffApplicationSummary';
import { StaffDetailProfileHeader } from './StaffDetailProfileHeader';
import { StaffAccountAccessSection } from './StaffAccountAccessSection';
import { showAppToast } from '../ui/AppToast';
import {
  confirmApproveStaffAccount,
  confirmRejectStaffAccount,
} from '../../lib/importantActionConfirm';
import { User } from 'lucide-react';

interface StaffStaffApplicationReviewPanelProps {
  member: SecurityGuard;
  canReview: boolean;
  onApproveStaffAccount?: (staffId: string) => void | Promise<void>;
  onRejectStaffAccount?: (staffId: string) => void | Promise<void>;
  onOpenStaffProfile?: (staffId: string) => void;
  reviewMeta?: React.ReactNode;
}

export function StaffStaffApplicationReviewPanel({
  member,
  canReview,
  onApproveStaffAccount,
  onRejectStaffAccount,
  onOpenStaffProfile,
  reviewMeta,
}: StaffStaffApplicationReviewPanelProps) {
  const [actionPending, setActionPending] = useState(false);
  const accountStatus = getGuardUserStatus(member);
  const isPending = accountStatus === 'pending';
  const displayName = member.name || member.badgeNumber;
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
  const memberManagedCities = (member.managedCities ?? []).filter(Boolean);
  const roleLabel = ROLE_LABELS[staffRoleToPlatformRole(staffRole)];
  const roleBadge = roleLabel === staffRole ? staffRole : `${staffRole} — ${roleLabel}`;

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

  const showReviewActions =
    canReview && isPending && (onApproveStaffAccount || onRejectStaffAccount);

  return (
    <div className="staff-detail-pane">
      <StaffDetailProfileHeader
        avatar={<ProfileAvatar src={member.avatar} name={displayName} size="lg" rounded="xl" />}
        name={displayName}
        email={member.email}
        emailPrefix="Work · "
        metrics={[
          { label: 'Staff ID', value: member.badgeNumber || '—' },
          { label: 'Account', value: statusLabel },
          ...(memberManagedCities.length > 0
            ? [{ label: 'Service areas', value: memberManagedCities.join(', '), wide: true }]
            : []),
        ]}
        badges={
          <>
            <WfBadge tone="primary">{roleBadge}</WfBadge>
            <WfBadge tone={statusTone}>{statusLabel}</WfBadge>
          </>
        }
      />

      <StaffAccountAccessSection
        title="Application review"
        leading={
          onOpenStaffProfile ? (
            <AppButton
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => onOpenStaffProfile(member.id)}
              startEnhancer={<User className="w-3.5 h-3.5" />}
            >
              View full staff profile
            </AppButton>
          ) : undefined
        }
      >
        {showReviewActions ? (
          <>
            {onApproveStaffAccount && (
              <AppButton
                variant="primary"
                size="sm"
                className="staff-action-btn--ok"
                disabled={actionPending}
                onClick={() => void handleApprove()}
              >
                Approve application
              </AppButton>
            )}
            {onRejectStaffAccount && (
              <AppButton
                variant="danger"
                size="sm"
                className="staff-action-btn--danger"
                disabled={actionPending}
                onClick={() => void handleReject()}
              >
                Deny application
              </AppButton>
            )}
          </>
        ) : null}
      </StaffAccountAccessSection>

      {canReview && isPending && !onApproveStaffAccount && !onRejectStaffAccount && (
        <section className="staff-detail-section space-y-2">
          <WfSectionHeader title="Application review" className="!px-0 !mb-0" />
          <p className="text-sm text-brand-text-muted">
            Only Directors and Founders can approve or deny staff applications.
          </p>
        </section>
      )}

      {reviewMeta}

      <StaffStaffApplicationSummary member={member} />
    </div>
  );
}
