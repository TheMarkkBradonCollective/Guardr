import { showAppConfirm } from '../components/ui/AppConfirm';

type AccountKind = 'guard' | 'client' | 'staff';

function accountLabel(kind: AccountKind): string {
  switch (kind) {
    case 'guard':
      return 'guard';
    case 'client':
      return 'client';
    case 'staff':
      return 'staff';
  }
}

export async function confirmMarkGuardTrusted(guardName: string): Promise<boolean> {
  return showAppConfirm({
    title: 'Mark guard as trusted?',
    message: `${guardName} will skip Guardr applicant review on Stripe jobs, and cash jobs will still require staff confirmation.`,
    confirmLabel: 'Mark trusted',
  });
}

export async function confirmRemoveGuardTrusted(
  guardName: string,
  options?: { scheduledJobCount?: number }
): Promise<boolean> {
  const scheduledJobs = options?.scheduledJobCount ?? 0;
  const impact =
    scheduledJobs > 0
      ? ` ${scheduledJobs} scheduled job${scheduledJobs === 1 ? '' : 's'} will be re-listed on the marketplace.`
      : ' Scheduled jobs will be re-listed on the marketplace.';
  return showAppConfirm({
    title: 'Remove trusted status?',
    message: `${guardName} will require Guardr applicant review on future job applications and will be removed from scheduled jobs.${impact}`,
    confirmLabel: 'Remove trusted',
    tone: 'danger',
  });
}

export async function confirmMarkClientTrusted(clientName: string): Promise<boolean> {
  return showAppConfirm({
    title: 'Mark client as trusted?',
    message: `${clientName}'s non-cash job postings will skip the Guardr approval queue and open to guards immediately.`,
    confirmLabel: 'Mark trusted',
  });
}

export async function confirmRemoveClientTrusted(clientName: string): Promise<boolean> {
  return showAppConfirm({
    title: 'Remove trusted status?',
    message: `${clientName}'s job postings will require Guardr staff approval before guards can apply.`,
    confirmLabel: 'Remove trusted',
    tone: 'danger',
  });
}

export async function confirmSuspendAccount(displayName: string, kind: AccountKind): Promise<boolean> {
  return showAppConfirm({
    title: kind === 'guard' ? 'Deactivate guard account?' : `Suspend ${accountLabel(kind)} account?`,
    message:
      kind === 'guard'
        ? `${displayName} will be deactivated and unable to use the platform until access is restored.`
        : `${displayName} will be suspended and unable to use the platform until restored.`,
    confirmLabel: kind === 'guard' ? 'Deactivate account' : 'Suspend account',
    tone: 'danger',
  });
}

export async function confirmBlockAccount(displayName: string, kind: AccountKind): Promise<boolean> {
  return showAppConfirm({
    title: kind === 'guard' ? 'Flag / block guard account?' : `Block ${accountLabel(kind)} account?`,
    message: `${displayName} will be blocked from platform access until restored by staff.`,
    confirmLabel: kind === 'guard' ? 'Flag / block' : 'Block account',
    tone: 'danger',
  });
}

export async function confirmRestoreAccount(displayName: string, kind: AccountKind): Promise<boolean> {
  return showAppConfirm({
    title: `Restore ${accountLabel(kind)} account?`,
    message: `${displayName} will regain active platform access.`,
    confirmLabel: 'Restore account',
  });
}

export async function confirmApproveGuardProfile(guardName: string): Promise<boolean> {
  return showAppConfirm({
    title: 'Approve guard profile?',
    message: `Approve ${guardName}'s profile so they can move toward account activation.`,
    confirmLabel: 'Approve profile',
  });
}

export async function confirmApproveClientAccount(clientName: string): Promise<boolean> {
  return showAppConfirm({
    title: 'Approve client account?',
    message: `Approve ${clientName} so they can post jobs on the platform.`,
    confirmLabel: 'Approve account',
  });
}

export async function confirmApproveStaffAccount(displayName: string): Promise<boolean> {
  return showAppConfirm({
    title: 'Approve staff application?',
    message: `Approve ${displayName} so they can sign in and use the Guardr staff console.`,
    confirmLabel: 'Approve application',
  });
}

export async function confirmRejectStaffAccount(displayName: string): Promise<boolean> {
  return showAppConfirm({
    title: 'Deny staff application?',
    message: `${displayName} will be removed and will not be able to sign in. This cannot be undone from this screen.`,
    confirmLabel: 'Deny application',
    tone: 'danger',
  });
}

export async function confirmBackgroundCheckToggle(guardName: string, markingChecked: boolean): Promise<boolean> {
  return showAppConfirm({
    title: markingChecked ? 'Mark background checked?' : 'Clear background check?',
    message: markingChecked
      ? `Mark ${guardName} as background checked on file.`
      : `Clear the background-checked flag for ${guardName}.`,
    confirmLabel: markingChecked ? 'Mark checked' : 'Clear flag',
    tone: markingChecked ? 'default' : 'danger',
  });
}

export async function confirmClearAuditViolations(guardName: string, count: number): Promise<boolean> {
  return showAppConfirm({
    title: 'Clear audit violations?',
    message: `Clear ${count} self-audit violation${count === 1 ? '' : 's'} for ${guardName}?`,
    confirmLabel: 'Clear violations',
  });
}

export async function confirmStaffRoleChange(memberName: string, newRole: string): Promise<boolean> {
  return showAppConfirm({
    title: 'Change staff role?',
    message: `Set ${memberName}'s platform role to ${newRole}? This changes their permissions immediately.`,
    confirmLabel: 'Save role',
  });
}

export async function confirmApproveTeamSlot(guardName: string, jobTitle: string): Promise<boolean> {
  return showAppConfirm({
    title: 'Approve guard?',
    message: `Approve ${guardName} for "${jobTitle}"? They will be confirmed on your roster.`,
    confirmLabel: 'Approve',
  });
}

export async function confirmDenyTeamSlot(guardName: string, jobTitle: string): Promise<boolean> {
  return showAppConfirm({
    title: 'Decline guard?',
    message: `Decline ${guardName} for "${jobTitle}"? They will not join this job.`,
    confirmLabel: 'Decline',
    tone: 'danger',
  });
}
