import React, { useState } from 'react';
import { SecurityGuard } from '../../types';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfSectionHeader } from '../ui/wireframe';
import { Mail } from 'lucide-react';
import { getGuardUserStatus } from '../../lib/accountStatus';
import { GuardRosterStatusBadges } from './GuardRosterStatusBadges';
import { StaffGuardApplicationSummary } from './StaffGuardApplicationSummary';
import { showAppToast } from '../ui/AppToast';
import { confirmApproveGuardProfile } from '../../lib/importantActionConfirm';
import {
  promptDenyGuardApplicationNote,
  promptRequestGuardApplicationRevisionNote,
  promptRevokeGuardApplicationNote,
} from '../../lib/staffDocumentReview';
import {
  getGuardActivationChecklist,
  guardCanStaffApproveProfile,
} from '../../lib/guardAccountActivation';
import { StaffGuardActivationChecklistView } from './StaffGuardActivationChecklistView';
import { StaffApplicationCredentialViewModal } from './StaffApplicationCredentialViewModal';

interface StaffGuardApplicationReviewPanelProps {
  guard: SecurityGuard;
  canReview: boolean;
  onApproveGuardAccount?: (guardId: string) => void | Promise<void>;
  onRejectGuardApplication?: (guardId: string, reason?: string) => void | Promise<void>;
  onRequestGuardApplicationRevision?: (guardId: string, reason?: string) => void | Promise<void>;
  onOpenGuardProfile?: (guardId: string) => void;
}

export function StaffGuardApplicationReviewPanel({
  guard,
  canReview,
  onApproveGuardAccount,
  onRejectGuardApplication,
  onRequestGuardApplicationRevision,
  onOpenGuardProfile,
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
    try {
      await onApproveGuardAccount(guard.id);
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not approve profile.', { tone: 'error' });
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

  const handleRevokeApplication = async () => {
    if (!onRejectGuardApplication) return;
    const reason = await promptRevokeGuardApplicationNote();
    if (reason === null) return;
    setActionPending(true);
    try {
      await onRejectGuardApplication(guard.id, reason);
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not revoke application.', { tone: 'error' });
    } finally {
      setActionPending(false);
    }
  };

  return (
    <div className="staff-detail-pane space-y-4">
      <div className="flex items-start gap-4 pb-4 border-b border-brand-border">
        <ProfileAvatar src={guard.avatar} name={guard.name} size="lg" rounded="xl" />
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-lg">{guard.name}</h2>
          <p className="text-sm text-brand-text-muted mt-1 inline-flex items-center gap-1.5">
            <Mail className="w-4 h-4 shrink-0" />
            {guard.email}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <GuardRosterStatusBadges guard={guard} showTrusted={false} />
          </div>
        </div>
      </div>

      {onOpenGuardProfile && (
        <button
          type="button"
          onClick={() => onOpenGuardProfile(guard.id)}
          className="text-xs font-semibold text-brand-primary hover:underline"
        >
          View full guard profile →
        </button>
      )}

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

      {canReview && (isPending || isApprovedOrActive) && (
        <section className="staff-detail-section space-y-3">
          <WfSectionHeader title="Review actions" className="!px-0 !mb-0" />
          <div className="staff-detail-actions">
            {isPending && onApproveGuardAccount && (
              <button
                type="button"
                onClick={() => void handleApproveProfile()}
                disabled={!guardCanStaffApproveProfile(guard) || actionPending}
                className="app-button-primary app-btn-sm disabled:opacity-50"
                title={
                  activationChecklist.staffApprovalBlockers.length > 0
                    ? activationChecklist.staffApprovalBlockers.join(' · ')
                    : 'Approve guard application'
                }
              >
                Approve application
              </button>
            )}
            {isPending && onRejectGuardApplication && (
              <button
                type="button"
                onClick={() => void handleDenyApplication()}
                disabled={actionPending}
                className="app-button-outline app-btn-sm text-red-400 border-red-500/40 disabled:opacity-50"
              >
                Deny application
              </button>
            )}
            {(isPending || isApprovedOrActive) && onRequestGuardApplicationRevision && (
              <button
                type="button"
                onClick={() => void handleRequestRevision()}
                disabled={actionPending}
                className="app-button-outline app-btn-sm disabled:opacity-50"
              >
                Request revision
              </button>
            )}
            {isApprovedOrActive && guardAccountStatus === 'approved' && onRejectGuardApplication && (
              <button
                type="button"
                onClick={() => void handleRevokeApplication()}
                disabled={actionPending}
                className="app-button-outline app-btn-sm text-red-400 border-red-500/40 disabled:opacity-50"
              >
                Revoke application
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
