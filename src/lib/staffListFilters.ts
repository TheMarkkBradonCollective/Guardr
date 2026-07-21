import type { Client, SecurityGuard } from '../types';
import {
  getClientAccountStatus,
  getGuardUserStatus,
  isClientAccountPending,
  isGuardAccountApproved,
  isGuardAccountPending,
  isStaffAccountPending,
} from './accountStatus';
import type { ApprovalFeedItem } from './staffApprovalsFeed';
import {
  CREDENTIAL_PENDING_UPLOAD_LABEL,
  isApplicationFeedItemPending,
  isCredentialFeedItemAwaitingStaffReview,
} from './staffApprovalsFeed';

export type ApplicationStatusFilter = 'all' | 'pending' | 'approved';
export type ApplicationKindFilter = 'all' | 'guard' | 'client';

export type CredentialStatusFilter = 'pending_upload' | 'pending_review' | 'verified' | 'all';

export type GuardRosterFilter = 'pending' | 'activated' | 'active' | 'all';

export type ClientRosterFilter = 'pending' | 'active' | 'suspended' | 'all';

export type StaffTeamFilter = 'pending' | 'active' | 'suspended' | 'all';

export function isCredentialFeedItemOpen(item: ApprovalFeedItem): boolean {
  return item.status === 'pending' || item.status === 'in_review';
}

export function isCredentialFeedItemPendingUpload(item: ApprovalFeedItem): boolean {
  return isCredentialFeedItemOpen(item) && item.statusLabel === CREDENTIAL_PENDING_UPLOAD_LABEL;
}

export function isCredentialFeedItemVerified(item: ApprovalFeedItem): boolean {
  return item.status === 'approved' || item.status === 'active';
}

export function matchesApplicationStatusFilter(
  item: ApprovalFeedItem,
  filter: ApplicationStatusFilter,
  guards: SecurityGuard[],
  clients: Client[]
): boolean {
  if (filter === 'all') return true;
  if (filter === 'pending') return isApplicationFeedItemPending(item, guards, clients);
  // approved — intake completed (approved label / still activating), not still pending review
  return !isApplicationFeedItemPending(item, guards, clients) && item.status === 'approved';
}

export function matchesApplicationKindFilter(
  kind: 'guard' | 'client',
  filter: ApplicationKindFilter
): boolean {
  if (filter === 'all') return true;
  return kind === filter;
}

export function matchesCredentialStatusFilter(
  item: ApprovalFeedItem,
  filter: CredentialStatusFilter
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'pending_review':
      return isCredentialFeedItemAwaitingStaffReview(item);
    case 'pending_upload':
      return isCredentialFeedItemPendingUpload(item);
    case 'verified':
      return isCredentialFeedItemVerified(item);
  }
}

export function matchesGuardRosterFilter(guard: SecurityGuard, filter: GuardRosterFilter): boolean {
  if (guard.isStaff) return false;
  const status = getGuardUserStatus(guard);
  switch (filter) {
    case 'all':
      return true;
    case 'pending':
      return isGuardAccountPending(guard);
    case 'activated':
      return isGuardAccountApproved(guard);
    case 'active':
      return status === 'active';
  }
}

export function matchesClientRosterFilter(client: Client, filter: ClientRosterFilter): boolean {
  const status = getClientAccountStatus(client);
  switch (filter) {
    case 'all':
      return true;
    case 'pending':
      return isClientAccountPending(client);
    case 'active':
      return status === 'active';
    case 'suspended':
      return status === 'suspended';
  }
}

export function matchesStaffTeamFilter(member: SecurityGuard, filter: StaffTeamFilter): boolean {
  if (!member.isStaff) return false;
  const status = getGuardUserStatus(member);
  switch (filter) {
    case 'all':
      return true;
    case 'pending':
      return isStaffAccountPending(member);
    case 'active':
      return status === 'active';
    case 'suspended':
      return status === 'suspended' || status === 'blocked';
  }
}

export function staffRosterSortRank(member: SecurityGuard): number {
  const status = getGuardUserStatus(member);
  const rank: Record<typeof status, number> = {
    pending: 0,
    approved: 1,
    active: 2,
    suspended: 3,
    blocked: 4,
  };
  return rank[status];
}
