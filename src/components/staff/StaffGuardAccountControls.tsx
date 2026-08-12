import { showAppToast } from '../ui/AppToast';
import React, { useState } from 'react';
import type { SecurityGuard } from '../../types';
import { GUARD_USER_STATUS_LABELS, getGuardUserStatus, type GuardUserStatus } from '../../lib/accountStatus';
import {
  guardCanBlockAccount,
  guardCanDeactivateAccount,
  guardCanDenyApplication,
  guardCanRestoreAccountAccess,
} from '../../lib/staffGuardAccountActions';
import {
  confirmBlockAccount,
  confirmRestoreAccount,
  confirmSuspendAccount,
} from '../../lib/importantActionConfirm';
import { showAppConfirm } from '../ui/AppConfirm';
import {
  promptDenyGuardApplicationNote,
} from '../../lib/staffDocumentReview';
import { guardCanStaffActivateAccount } from '../../lib/guardAccountActivation';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { AppButton } from '../ui/AppButton';

interface StaffGuardAccountControlsProps {
  guard: SecurityGuard;
  canManage?: boolean;
  canSuspend?: boolean;
  onUpdateUserStatus?: (guardId: string, status: 'active' | 'suspended' | 'blocked') => void | Promise<void>;
  onRejectGuardApplication?: (guardId: string, reason?: string) => void | Promise<void>;
  showApplicationActions?: boolean;
  leadingActions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

function statusBadgeTone(status: GuardUserStatus): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'active') return 'success';
  if (status === 'pending' || status === 'approved') return 'warning';
  if (status === 'suspended' || status === 'blocked') return 'danger';
  return 'default';
}

/** Suspend, block, restore, and deny pending guard applications. */
export function StaffGuardAccountControls({
  guard,
  canManage = false,
  canSuspend = false,
  onUpdateUserStatus,
  onRejectGuardApplication,
  showApplicationActions = true,
  leadingActions,
  children,
  className = '',
}: StaffGuardAccountControlsProps) {
  const [actionPending, setActionPending] = useState(false);
  if (!canManage || guard.isStaff) return null;

  const status = getGuardUserStatus(guard);
  const canModerateAccess = canSuspend && Boolean(onUpdateUserStatus || onRejectGuardApplication);

  const runStatusUpdate = async (next: 'active' | 'suspended' | 'blocked') => {
    if (!onUpdateUserStatus) return;
    const confirmed =
      next === 'suspended'
        ? await confirmSuspendAccount(guard.name, 'guard')
        : next === 'blocked'
          ? await confirmBlockAccount(guard.name, 'guard')
          : await confirmRestoreAccount(guard.name, 'guard');
    if (!confirmed) return;
    setActionPending(true);
    try {
      await onUpdateUserStatus(guard.id, next);
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not update account access.', { tone: 'error' });
    } finally {
      setActionPending(false);
    }
  };

  const runActivateAccount = async () => {
    if (!onUpdateUserStatus) return;
    if (!guardCanStaffActivateAccount(guard)) {
      showAppToast('Verify all five activation credentials before activating this account.', {
        tone: 'error',
      });
      return;
    }
    const confirmed = await showAppConfirm({
      title: 'Activate guard account?',
      message: `Activate ${guard.name} for marketplace access. They will be able to browse and accept jobs.`,
      confirmLabel: 'Activate account',
    });
    if (!confirmed) return;
    setActionPending(true);
    try {
      await onUpdateUserStatus(guard.id, 'active');
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not activate account.', { tone: 'error' });
    } finally {
      setActionPending(false);
    }
  };

  const runDenyApplication = async () => {
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

  const canActivateAccount =
    status === 'approved' && Boolean(onUpdateUserStatus) && guardCanStaffActivateAccount(guard);

  const showAccessActions =
    canModerateAccess &&
    (guardCanDeactivateAccount(status) ||
      guardCanBlockAccount(status) ||
      guardCanRestoreAccountAccess(status) ||
      guardCanDenyApplication(status) ||
      canActivateAccount);

  return (
    <section className={`staff-detail-section space-y-3 ${className}`.trim()}>
      {leadingActions ? <div className="staff-detail-actions">{leadingActions}</div> : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <WfSectionHeader title="Account access" className="!px-0 !mb-0" />
        <WfBadge tone={statusBadgeTone(status)}>{GUARD_USER_STATUS_LABELS[status]}</WfBadge>
      </div>

      {!canSuspend && (
        <p className="text-xs text-brand-text-muted leading-relaxed">
          Administrator+ permission required to deactivate, block, or restore guard accounts.
        </p>
      )}

      {showAccessActions ? (
        <div className="staff-detail-actions">
          {showApplicationActions && guardCanDenyApplication(status) && onRejectGuardApplication && (
            <AppButton
              variant="danger"
              size="sm"
              className="staff-action-btn--danger"
              disabled={actionPending}
              onClick={() => void runDenyApplication()}
            >
              Deny application
            </AppButton>
          )}
          {canActivateAccount && (
            <AppButton
              variant="primary"
              size="sm"
              className="staff-action-btn--ok"
              disabled={actionPending}
              onClick={() => void runActivateAccount()}
              title="Activate marketplace access — all five credentials are verified"
            >
              Activate account
            </AppButton>
          )}
          {guardCanDeactivateAccount(status) && onUpdateUserStatus && (
            <AppButton
              variant="outline"
              size="sm"
              className="staff-action-btn--warn"
              disabled={actionPending}
              onClick={() => void runStatusUpdate('suspended')}
              title="Temporarily deactivate marketplace access — guard can be restored later"
            >
              Deactivate
            </AppButton>
          )}
          {guardCanBlockAccount(status) && onUpdateUserStatus && (
            <AppButton
              variant="danger"
              size="sm"
              className="staff-action-btn--danger"
              disabled={actionPending}
              onClick={() => void runStatusUpdate('blocked')}
              title="Block platform access until staff restores the account"
            >
              Block
            </AppButton>
          )}
          {guardCanRestoreAccountAccess(status) && onUpdateUserStatus && (
            <AppButton
              variant="primary"
              size="sm"
              className="staff-action-btn--ok"
              disabled={actionPending}
              onClick={() => void runStatusUpdate('active')}
            >
              Restore access
            </AppButton>
          )}
        </div>
      ) : null}

      {children ? <div className="staff-detail-actions">{children}</div> : null}
    </section>
  );
}
