import React, { useState } from 'react';
import { SecurityGuard } from '../../types';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppButton } from '../ui/AppButton';
import { getGuardUserStatus } from '../../lib/accountStatus';
import { GuardRosterStatusBadges } from './GuardRosterStatusBadges';
import { StaffGuardApplicationSummary } from './StaffGuardApplicationSummary';
import { StaffDetailProfileHeader } from './StaffDetailProfileHeader';
import { StaffAccountAccessSection } from './StaffAccountAccessSection';
import { showAppToast } from '../ui/AppToast';
import { confirmApproveGuardProfile } from '../../lib/importantActionConfirm';
import {
  promptDenyGuardApplicationNote,
  promptRequestGuardApplicationRevisionNote,
} from '../../lib/staffDocumentReview';
import {
  getGuardActivationChecklist,
  guardCanStaffApproveProfile,
} from '../../lib/guardAccountActivation';
import { StaffGuardActivationChecklistView } from './StaffGuardActivationChecklistView';
import { StaffApplicationCredentialViewModal } from './StaffApplicationCredentialViewModal';
import { GUARD_ICN_SHORT_LABEL } from '../../lib/guardContractorNumber';
import { GuardArmedStatusPill } from '../guard/GuardArmedStatusPill';
import { User } from 'lucide-react';

interface StaffGuardApplicationReviewPanelProps {
  guard: SecurityGuard;
  canReview: boolean;
  onApproveGuardAccount?: (guardId: string) => void | Promise<void>;
  onRejectGuardApplication?: (guardId: string, reason?: string) => void | Promise<void>;
  onRequestGuardApplicationRevision?: (guardId: string, reason?: string) => void | Promise<void>;
  onOpenGuardProfile?: (guardId: string) => void;
  reviewMeta?: React.ReactNode;
}

export function StaffGuardApplicationReviewPanel({
  guard,
  canReview,
  onApproveGuardAccount,
  onRejectGuardApplication,
  onRequestGuardApplicationRevision,
  onOpenGuardProfile,
  reviewMeta,
}: StaffGuardApplicationReviewPanelProps) {
  const [actionPending, setActionPending] = useState(false);
  const [viewingCredentialItemId, setViewingCredentialItemId] = useState<string | null>(null);
  const guardAccountStatus = getGuardUserStatus(guard);
  const activationChecklist = getGuardActivationChecklist(guard);
  const isPending = guardAccountStatus === 'pending';
  const isApprovedOrActive =
    guardAccountStatus === 'approved' || guardAccountStatus === 'active';

  const handleApproveProfile = async () => {
    if (!onApproveGuardAccount || !guardCanStaffApproveProfile(guard)) return;
    if (!(await confirmApproveGuardProfile(guard.name))) return;
    setActionPending(true);
    try {
      await onApproveGuardAccount(guard.id);
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not approve profile.', { tone: 'error' });
    } finally {
      setActionPending(false);
    }
  };

  const handleDenyApplication = async () => {
    if (!onRejectGuardApplication) return;
    const reason = await promptDenyGuardApplicationNote();
    if (reason === null) return;
    setActionPending(true);
    try {
      await onRejectGuardApplication(guard.id, reason);
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not deny application.', { tone: 'error' });
    } finally {
      setActionPending(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!onRequestGuardApplicationRevision) return;
    const reason = await promptRequestGuardApplicationRevisionNote();
    if (reason === null) return;
    setActionPending(true);
    try {
      await onRequestGuardApplicationRevision(guard.id, reason);
      showAppToast('Revision requested — application returned to Pending.');
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not request revision.', { tone: 'error' });
    } finally {
      setActionPending(false);
    }
  };

  const showReviewActions =
    canReview && (isPending || isApprovedOrActive) &&
    (onApproveGuardAccount || onRejectGuardApplication || onRequestGuardApplicationRevision);

  return (
    <div className="staff-detail-pane">
      <StaffDetailProfileHeader
        avatar={<ProfileAvatar src={guard.avatar} name={guard.name} size="lg" rounded="xl" />}
        name={guard.name}
        email={guard.email}
        metrics={[
          { label: GUARD_ICN_SHORT_LABEL, value: guard.badgeNumber || '—' },
          { label: 'Rating', value: `★ ${guard.rating}` },
        ]}
        badges={
          <>
            <GuardArmedStatusPill guard={guard} />
            <GuardRosterStatusBadges guard={guard} showTrusted={false} className="shrink-0" />
          </>
        }
        editAction={
          onOpenGuardProfile ? (
            <AppButton
              variant="outline"
              size="sm"
              onClick={() => onOpenGuardProfile(guard.id)}
              startEnhancer={<User className="w-3.5 h-3.5" />}
            >
              View full guard profile
            </AppButton>
          ) : undefined
        }
      />

      <StaffAccountAccessSection
        title="Application review"
        leading={
          showReviewActions && isPending && onApproveGuardAccount ? (
            <AppButton
              variant="primary"
              size="sm"
              fullWidth
              className="staff-action-btn--ok"
              disabled={!guardCanStaffApproveProfile(guard) || actionPending}
              onClick={() => void handleApproveProfile()}
              title={
                activationChecklist.staffApprovalBlockers.length > 0
                  ? activationChecklist.staffApprovalBlockers.join(' · ')
                  : 'Approve guard application'
              }
            >
              Approve application
            </AppButton>
          ) : undefined
        }
      >
        {showReviewActions ? (
          <>
            {isPending && onRejectGuardApplication && (
              <AppButton
                variant="danger"
                size="sm"
                className="staff-action-btn--danger"
                disabled={actionPending}
                onClick={() => void handleDenyApplication()}
              >
                Deny application
              </AppButton>
            )}
            {(isPending || isApprovedOrActive) && onRequestGuardApplicationRevision && (
              <AppButton
                variant="outline"
                size="sm"
                className="staff-action-btn--warn"
                disabled={actionPending}
                onClick={() => void handleRequestRevision()}
              >
                Request revision
              </AppButton>
            )}
          </>
        ) : null}
      </StaffAccountAccessSection>

      {reviewMeta}

      <StaffGuardApplicationSummary guard={guard} />

      {!guard.isStaff && (
        <StaffGuardActivationChecklistView
          guard={guard}
          onViewCredential={setViewingCredentialItemId}
        />
      )}

      {viewingCredentialItemId && (
        <StaffApplicationCredentialViewModal
          guard={guard}
          credentialItemId={viewingCredentialItemId}
          onClose={() => setViewingCredentialItemId(null)}
        />
      )}
    </div>
  );
}
