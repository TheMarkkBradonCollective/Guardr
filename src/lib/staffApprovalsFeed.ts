import type { Certification, Client, SecurityGuard, SecurityRequest } from '../types';
import type { AuditLogEntry, AuditAction } from './auditLog';
import { isFieldGuardAccount, belongsInClientApplicationFeed, isSelfSubmittedGuardAccount } from './approvalSubmissions';
import { certDisplayName } from './certCatalog';
import { certHasPendingUpdate } from './certRevisionHistory';
import { resolveCertImageUrl } from './certificationLoad';
import {
  activationCredentialItemId,
  coiApprovalItemId,
  govIdApprovalItemId,
  guardIdFromCoiApprovalItemId,
  guardIdFromGovIdApprovalItemId,
  isCoiApprovalItemId,
  isGovIdApprovalItemId,
  parseActivationCredentialItemId,
  type ActivationCredentialKey,
} from './guardCredentialSections';
import { formatCoiSummaryLine } from './guardInsurance';
import {
  getGuardIdVerificationStatus,
  guardGovIdBelongsInCredentialFeed,
  guardGovIdNeedsDocumentTypeSelection,
  ID_VERIFICATION_STATUS_LABELS,
} from './guardIdentityVerification';
import { getClientAccountStatus, isClientAccountPending, isGuardAccountApproved, isGuardAccountPending, getGuardUserStatus } from './accountStatus';
import { guardActivationSummaryLabel } from './guardAccountActivation';
import { isGuardCredentialExpiryRestricted } from './guardCredentialExpiryEnforcement';
import {
  getGuardApplicationCredentialSteps,
  type GuardApplicationCredentialStep,
} from './guardApplicationCredentialSteps';
import type { ApprovalQueueId } from './staffOps';
import { getPendingScheduleChangeApprovals } from './jobScheduleChange';

export type ApprovalFeedQueue = Exclude<ApprovalQueueId, 'accounts' | 'all'>;

export type ApprovalFeedStatus = 'pending' | 'approved' | 'denied' | 'active' | 'rejected' | 'in_review';

export interface ApprovalFeedItem {
  id: string;
  queue: ApprovalFeedQueue;
  title: string;
  subtitle: string;
  status: ApprovalFeedStatus;
  statusLabel: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedByName?: string;
  reviewedByEmail?: string;
  /** Account application approval (profile), distinct from marketplace activation. */
  approvedAt?: string;
  approvedByName?: string;
  approvedByEmail?: string;
  activatedAt?: string;
  activatedByName?: string;
  activatedByEmail?: string;
  sortKey: number;
}

export interface StaffApprovalsFeedInput {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  clients: Client[];
  auditLog?: AuditLogEntry[];
}

export const APPLICATION_FEED_STATUS_LABELS = {
  pending: 'Pending application',
  approved: 'Application approved',
  active: 'Active on marketplace',
  restricted: 'Restricted',
  blocked: 'Blocked',
  suspended: 'Suspended',
  clientNotApproved: 'Not approved',
} as const;

export const CREDENTIAL_PENDING_UPLOAD_LABEL = 'Pending upload';

function latestAudit(
  auditLog: AuditLogEntry[],
  entityId: string,
  actions: AuditAction[]
): AuditLogEntry | undefined {
  return auditLog.find((entry) => entry.entityId === entityId && actions.includes(entry.action));
}

function actorLabel(entry?: AuditLogEntry): { name?: string; email?: string; at?: string } {
  if (!entry) return {};
  return {
    name: entry.actorEmail?.split('@')[0],
    email: entry.actorEmail,
    at: entry.createdAt,
  };
}

function statusSortWeight(status: ApprovalFeedStatus): number {
  if (status === 'pending' || status === 'in_review') return 0;
  return 1;
}

function compareFeedItems(a: ApprovalFeedItem, b: ApprovalFeedItem): number {
  const pendingDelta = statusSortWeight(a.status) - statusSortWeight(b.status);
  if (pendingDelta !== 0) return pendingDelta;
  return b.sortKey - a.sortKey;
}

function jobOfferItems(requests: SecurityRequest[], auditLog: AuditLogEntry[]): ApprovalFeedItem[] {
  return requests
    .filter((r) => r.status === 'pending-review' || r.openedAt || (r.status === 'closed' && !r.openedAt))
    .map((req) => {
      const pending = req.status === 'pending-review';
      const approved = Boolean(req.openedAt);
      const audit = latestAudit(auditLog, req.id, ['job_approved', 'job_denied']);
      const actor = actorLabel(audit);
      const status: ApprovalFeedStatus = pending ? 'pending' : approved ? 'approved' : 'denied';
      return {
        id: req.id,
        queue: 'job-offers',
        title: req.title,
        subtitle: `${req.clientName} · ${req.location}`,
        status,
        statusLabel: pending ? 'Pending review' : approved ? 'Approved' : 'Declined',
        submittedAt: req.startDate,
        reviewedAt: approved ? req.openedAt ?? actor.at : actor.at,
        reviewedByName: actor.name,
        reviewedByEmail: actor.email,
        sortKey: new Date(actor.at ?? req.openedAt ?? req.startDate).getTime(),
      };
    });
}

function scheduleChangeItems(requests: SecurityRequest[], auditLog: AuditLogEntry[]): ApprovalFeedItem[] {
  const pending = getPendingScheduleChangeApprovals(requests);
  const pendingIds = new Set(pending.map((r) => r.id));
  const items: ApprovalFeedItem[] = pending.map((req) => ({
    id: req.id,
    queue: 'schedule-changes',
    title: req.title,
    subtitle: `${req.clientName} · ${req.location}`,
    status: 'pending',
    statusLabel:
      req.scheduleChangeStatus === 'pending_staff_billing' ? 'Confirm billing' : 'Schedule change',
    submittedAt: req.scheduleChangeRequestedAt,
    sortKey: new Date(req.scheduleChangeRequestedAt ?? req.startDate).getTime(),
  }));

  for (const entry of auditLog) {
    if (
      (entry.action !== 'schedule_change_approved' && entry.action !== 'schedule_change_rejected') ||
      !entry.entityId ||
      pendingIds.has(entry.entityId)
    ) {
      continue;
    }
    const req = requests.find((r) => r.id === entry.entityId);
    if (!req) continue;
    const actor = actorLabel(entry);
    const denied = entry.action === 'schedule_change_rejected';
    items.push({
      id: req.id,
      queue: 'schedule-changes',
      title: req.title,
      subtitle: `${req.clientName} · ${req.location}`,
      status: denied ? 'denied' : 'approved',
      statusLabel: denied ? 'Schedule declined' : 'Schedule approved',
      submittedAt: req.scheduleChangeRequestedAt,
      reviewedAt: actor.at,
      reviewedByName: actor.name,
      reviewedByEmail: actor.email,
      sortKey: new Date(actor.at ?? req.startDate).getTime(),
    });
  }

  return items;
}

function accountSignupApplicationItems(
  guards: SecurityGuard[],
  clients: Client[],
  auditLog: AuditLogEntry[]
): ApprovalFeedItem[] {
  const guardItems = guardAccountItems(guards, auditLog)
    .filter((item) => item.queue === 'guard-accounts' && belongsInApplicationFeed(item))
    .map((item) => ({ ...item, queue: 'applications' as const }));

  const clientItems = clientAccountItems(clients, auditLog)
    .filter((item) => belongsInApplicationFeed(item))
    .map((item) => ({ ...item, queue: 'applications' as const }));

  // Staff application review UI comes later; list pending/reviewed staff intake here.
  const staffItems = staffAccountItems(guards, auditLog)
    .filter((item) => belongsInApplicationFeed(item))
    .map((item) => ({ ...item, queue: 'applications' as const }));

  return [...clientItems, ...guardItems, ...staffItems];
}

function belongsInApplicationFeed(item: ApprovalFeedItem): boolean {
  return (
    item.status === 'pending' ||
    item.status === 'in_review' ||
    item.status === 'approved' ||
    item.status === 'active' ||
    item.status === 'denied' ||
    item.status === 'rejected'
  );
}

/** Applications section — account intake plus approved / marketplace-active for staff audit. */
export function buildApplicationFeed(
  guards: SecurityGuard[],
  clients: Client[],
  auditLog: AuditLogEntry[] = []
): ApprovalFeedItem[] {
  return accountSignupApplicationItems(guards, clients, auditLog).sort(compareFeedItems);
}

export function isApplicationFeedItemPending(
  item: ApprovalFeedItem,
  _guards: SecurityGuard[],
  _clients: Client[]
): boolean {
  return item.status === 'pending' || item.status === 'in_review';
}

/** Open intake pipeline — pending sign-ups plus approved applications still activating. */
export function isApplicationFeedItemOpen(
  item: ApprovalFeedItem,
  _guards: SecurityGuard[],
  _clients: Client[]
): boolean {
  return item.status === 'pending' || item.status === 'in_review' || item.status === 'approved';
}

export function countPendingAccountSignupApplications(
  guards: SecurityGuard[],
  clients: Client[]
): number {
  const pendingGuards = guards.filter((g) => !g.isStaff && isGuardAccountPending(g)).length;
  const pendingClients = clients.filter(isClientAccountPending).length;
  return pendingGuards + pendingClients;
}

function guardBelongsInCredentialActivationQueue(guard: SecurityGuard): boolean {
  if (guard.isStaff) return false;
  const status = getGuardUserStatus(guard);
  return status === 'pending' || status === 'approved';
}

function missingActivationCredentialItemId(
  guardId: string,
  step: GuardApplicationCredentialStep
): string {
  if (step.key === 'gov-id') return govIdApprovalItemId(guardId);
  if (step.key === 'coi') return coiApprovalItemId(guardId);
  return activationCredentialItemId(guardId, step.key);
}

function appendMissingActivationCredentialItems(
  guard: SecurityGuard,
  items: ApprovalFeedItem[],
  existingIds: Set<string>
): void {
  if (!guardBelongsInCredentialActivationQueue(guard)) return;

  for (const step of getGuardApplicationCredentialSteps(guard)) {
    if (step.status !== 'pending') continue;
    const itemId = missingActivationCredentialItemId(guard.id, step);
    if (existingIds.has(itemId)) continue;

    items.push({
      id: itemId,
      queue: 'credentials',
      title: `${guard.name} — ${step.label}`,
      subtitle: 'Awaiting guard upload',
      status: 'pending',
      statusLabel: CREDENTIAL_PENDING_UPLOAD_LABEL,
      sortKey: 0,
    });
    existingIds.add(itemId);
  }
}

function credentialItems(guards: SecurityGuard[], auditLog: AuditLogEntry[]): ApprovalFeedItem[] {
  const items: ApprovalFeedItem[] = [];

  for (const guard of guards) {
    if (guard.isStaff) continue;
    const guardItemIds = new Set<string>();

    for (const cert of guard.certifications) {
      if (cert.submittedByRole === 'staff') continue;
      if (!isSelfSubmittedGuardAccount(guard) && cert.submittedByRole !== 'guard') continue;
      if (cert.status === 'rejected' && !cert.imageUrl) continue;
      if (cert.status === 'pending' && !cert.imageUrl && !certHasPendingUpdate(cert)) continue;

      const pendingUpdateReview = certHasPendingUpdate(cert);
      const pending = cert.status === 'pending' || pendingUpdateReview;
      const audit = latestAudit(auditLog, cert.id, ['cert_verified']);
      const actor = actorLabel(audit);
      const status: ApprovalFeedStatus = pendingUpdateReview
        ? 'pending'
        : cert.status === 'verified'
          ? 'approved'
          : cert.status === 'rejected'
            ? 'denied'
            : 'pending';

      items.push({
        id: cert.id,
        queue: 'credentials',
        title: `${guard.name} — ${certDisplayName(cert)}`,
        subtitle: pendingUpdateReview
          ? `${cert.pendingUpdate?.issuer ?? cert.issuer} · update pending review`
          : `${cert.issuer} · #${cert.number}`,
        status,
        statusLabel: pendingUpdateReview
          ? 'Update pending review'
          : cert.status === 'verified'
            ? 'Verified'
            : cert.status === 'rejected'
              ? 'Rejected'
              : 'Pending review',
        submittedAt: cert.issueDate,
        reviewedAt: actor.at,
        reviewedByName: actor.name,
        reviewedByEmail: actor.email,
        sortKey: new Date(actor.at ?? cert.issueDate).getTime(),
      });
      guardItemIds.add(cert.id);
    }

    const policy = guard.insurancePolicy;
    if (policy && policy.status !== 'not_submitted') {
      items.push({
        id: coiApprovalItemId(guard.id),
        queue: 'credentials',
        title: `${guard.name} — Certificate of Insurance`,
        subtitle: formatCoiSummaryLine(policy),
        status:
          policy.status === 'verified'
            ? 'approved'
            : policy.status === 'rejected'
              ? 'denied'
              : 'pending',
        statusLabel:
          policy.status === 'verified'
            ? 'Verified'
            : policy.status === 'rejected'
              ? 'Rejected'
              : 'Pending review',
        submittedAt: policy.submittedAt,
        reviewedAt: policy.reviewedAt,
        reviewedByName: policy.reviewedBy,
        reviewedByEmail: policy.reviewedBy,
        sortKey: new Date(policy.reviewedAt ?? policy.submittedAt ?? 0).getTime() || Date.now(),
      });
      guardItemIds.add(coiApprovalItemId(guard.id));
    }

    const idStatus = getGuardIdVerificationStatus(guard);
    if (guardGovIdBelongsInCredentialFeed(guard)) {
      const needsDocumentType = guardGovIdNeedsDocumentTypeSelection(guard);
      const awaitingReview = idStatus === 'pending' || idStatus === 'not_submitted';
      items.push({
        id: govIdApprovalItemId(guard.id),
        queue: 'credentials',
        title: `${guard.name} — Government ID`,
        subtitle: needsDocumentType
          ? 'Select Government ID or driver’s license'
          : ID_VERIFICATION_STATUS_LABELS[idStatus === 'not_submitted' ? 'pending' : idStatus],
        status:
          idStatus === 'verified' ? 'approved' : idStatus === 'rejected' ? 'denied' : 'pending',
        statusLabel:
          idStatus === 'verified'
            ? 'Verified'
            : idStatus === 'rejected'
              ? 'Rejected'
              : 'Pending review',
        submittedAt: guard.idVerificationSubmittedAt,
        reviewedAt: guard.idVerificationReviewedAt,
        reviewedByName: undefined,
        reviewedByEmail: undefined,
        sortKey: new Date(
          guard.idVerificationReviewedAt ?? guard.idVerificationSubmittedAt ?? 0
        ).getTime() || (awaitingReview ? Date.now() : 0),
      });
      guardItemIds.add(govIdApprovalItemId(guard.id));
    }

    appendMissingActivationCredentialItems(guard, items, guardItemIds);
  }

  return items;
}

function guardAccountItems(guards: SecurityGuard[], auditLog: AuditLogEntry[]): ApprovalFeedItem[] {
  return guards
    .filter((g) => isFieldGuardAccount(g))
    .map((guard) => {
      const userStatus = getGuardUserStatus(guard);
      const approvedProfile = isGuardAccountApproved(guard);
      const active = userStatus === 'active';
      const pending = userStatus === 'pending';
      const activationAudit = latestAudit(auditLog, guard.id, ['guard_activated']);
      const profileAudit = latestAudit(auditLog, guard.id, [
        'guard_approved',
        'guard_application_revision_requested',
        'guard_application_revoked',
      ]);
      const approvalAudit = latestAudit(auditLog, guard.id, ['guard_approved']);
      const activationActor = actorLabel(activationAudit);
      const approvalActor = actorLabel(approvalAudit);
      const actor = actorLabel(active ? activationAudit ?? profileAudit : profileAudit);

      let status: ApprovalFeedStatus = 'pending';
      let statusLabel: string = APPLICATION_FEED_STATUS_LABELS.pending;
      if (isGuardCredentialExpiryRestricted(guard)) {
        status = 'denied';
        statusLabel = APPLICATION_FEED_STATUS_LABELS.restricted;
      } else if (active) {
        status = 'active';
        statusLabel = APPLICATION_FEED_STATUS_LABELS.active;
      } else if (approvedProfile) {
        status = 'approved';
        statusLabel = APPLICATION_FEED_STATUS_LABELS.approved;
      } else if (userStatus === 'suspended' || userStatus === 'blocked') {
        status = 'denied';
        statusLabel =
          userStatus === 'blocked'
            ? APPLICATION_FEED_STATUS_LABELS.blocked
            : APPLICATION_FEED_STATUS_LABELS.suspended;
      } else if (!pending) {
        statusLabel = guardActivationSummaryLabel(guard);
      }

      return {
        id: guard.id,
        queue: 'guard-accounts',
        title: guard.name,
        subtitle: guard.email,
        status,
        statusLabel,
        submittedAt: guard.idVerificationSubmittedAt,
        reviewedAt:
          active
            ? activationAudit?.createdAt ?? approvalAudit?.createdAt ?? guard.idVerificationReviewedAt
            : approvedProfile
              ? approvalAudit?.createdAt ?? guard.idVerificationReviewedAt
              : profileAudit?.createdAt ?? guard.idVerificationReviewedAt,
        reviewedByName: actor.name,
        reviewedByEmail: actor.email,
        approvedAt: approvalActor.at,
        approvedByName: approvalActor.name,
        approvedByEmail: approvalActor.email,
        activatedAt: activationActor.at,
        activatedByName: activationActor.name,
        activatedByEmail: activationActor.email,
        sortKey: new Date(
          actor.at ?? guard.idVerificationReviewedAt ?? guard.idVerificationSubmittedAt ?? 0
        ).getTime() || Date.now(),
      };
    });
}

function staffAccountItems(guards: SecurityGuard[], auditLog: AuditLogEntry[]): ApprovalFeedItem[] {
  return guards
    .filter((g) => {
      if (!g.isStaff) return false;
      if (g.userStatus === 'pending') return true;
      return Boolean(latestAudit(auditLog, g.id, ['staff_approved', 'staff_rejected']));
    })
    .map((member) => {
      const userStatus = member.userStatus ?? 'active';
      const pending = userStatus === 'pending';
      const audit = latestAudit(auditLog, member.id, ['staff_approved', 'staff_rejected']);
      const actor = actorLabel(audit);
      const status: ApprovalFeedStatus = pending
        ? 'pending'
        : userStatus === 'suspended' || userStatus === 'blocked'
          ? 'denied'
          : 'approved';

      return {
        id: member.id,
        queue: 'staff-accounts',
        title: member.badgeNumber || member.name,
        subtitle: `${member.staffRole ?? 'Staff'} · ${member.email}`,
        status,
        statusLabel: pending
          ? 'Pending Director approval'
          : userStatus === 'active'
            ? 'Active'
            : userStatus === 'suspended'
              ? 'Suspended'
              : userStatus === 'blocked'
                ? 'Blocked'
                : 'Reviewed',
        submittedAt: member.id.includes('-') ? undefined : undefined,
        reviewedAt: actor.at,
        reviewedByName: actor.name,
        reviewedByEmail: actor.email,
        sortKey: new Date(actor.at ?? 0).getTime() || Date.now(),
      };
    });
}

function clientAccountItems(clients: Client[], auditLog: AuditLogEntry[]): ApprovalFeedItem[] {
  return clients
    .filter(belongsInClientApplicationFeed)
    .map((client) => {
      const accountStatus = getClientAccountStatus(client);
      const audit = latestAudit(auditLog, client.id, [
        'client_approved',
        'client_application_revision_requested',
        'client_application_revoked',
      ]);
      const approvalAudit = latestAudit(auditLog, client.id, ['client_approved']);
      const actor = actorLabel(audit);
      const approvalActor = actorLabel(approvalAudit);
      const status: ApprovalFeedStatus =
        accountStatus === 'pending'
          ? 'pending'
          : accountStatus === 'active'
            ? 'approved'
            : 'denied';

      return {
        id: client.id,
        queue: 'client-accounts',
        title: client.companyName || client.name,
        subtitle: client.email,
        status,
        statusLabel:
          accountStatus === 'pending'
            ? APPLICATION_FEED_STATUS_LABELS.pending
            : accountStatus === 'active'
              ? APPLICATION_FEED_STATUS_LABELS.approved
              : APPLICATION_FEED_STATUS_LABELS.clientNotApproved,
        submittedAt: client.createdAt,
        reviewedAt: actor.at,
        reviewedByName: actor.name,
        reviewedByEmail: actor.email,
        approvedAt: approvalActor.at,
        approvedByName: approvalActor.name,
        approvedByEmail: approvalActor.email,
        sortKey: new Date(actor.at ?? client.createdAt ?? 0).getTime() || Date.now(),
      };
    });
}

export function buildStaffApprovalsFeed(input: StaffApprovalsFeedInput): ApprovalFeedItem[] {
  const auditLog = input.auditLog ?? [];
  const items = [
    ...jobOfferItems(input.requests, auditLog),
    ...scheduleChangeItems(input.requests, auditLog),
    ...accountSignupApplicationItems(input.guards, input.clients, auditLog),
    ...credentialItems(input.guards, auditLog),
    ...guardAccountItems(input.guards, auditLog),
    ...staffAccountItems(input.guards, auditLog),
    ...clientAccountItems(input.clients, auditLog),
  ];
  return items.sort(compareFeedItems);
}

export function filterApprovalsFeedByQueue(
  feed: ApprovalFeedItem[],
  queue: ApprovalQueueId
): ApprovalFeedItem[] {
  if (queue === 'all' || queue === 'accounts') return feed;
  return feed.filter((item) => item.queue === queue);
}

export function countPendingInFeed(feed: ApprovalFeedItem[]): number {
  return feed.filter((item) => item.status === 'pending' || item.status === 'in_review').length;
}

export function countPendingInFeedByQueue(
  feed: ApprovalFeedItem[],
  queue: ApprovalQueueId
): number {
  return filterApprovalsFeedByQueue(feed, queue).filter(
    (item) => item.status === 'pending' || item.status === 'in_review'
  ).length;
}

export function resolveApprovalFocusItemId(
  feed: ApprovalFeedItem[],
  queue: ApprovalQueueId,
  guardId: string,
  guards: SecurityGuard[]
): string | null {
  const scoped = filterApprovalsFeedByQueue(feed, queue);
  const guard = guards.find((g) => g.id === guardId);
  const matches = scoped.filter((item) => {
    if (item.queue === 'guard-accounts') return item.id === guardId;
    if (item.queue === 'staff-accounts') return item.id === guardId;
    if (item.queue === 'credentials') {
      if (item.id === coiApprovalItemId(guardId)) return true;
      if (item.id === govIdApprovalItemId(guardId)) return true;
      if (parseActivationCredentialItemId(item.id)?.guardId === guardId) return true;
      return guard?.certifications.some((cert) => cert.id === item.id) ?? false;
    }
    return false;
  });
  const pending = matches.find((item) => item.status === 'pending' || item.status === 'in_review');
  if (pending) return pending.id;
  if (matches[0]) return matches[0].id;
  if (queue === 'guard-accounts' || queue === 'staff-accounts' || queue === 'all') return guardId;
  return null;
}

export function findFeedItem(feed: ApprovalFeedItem[], id: string): ApprovalFeedItem | undefined {
  return feed.find((item) => item.id === id || (isCoiApprovalItemId(id) && item.id === id));
}

export type CredentialFeedContext =
  | { kind: 'cert'; guard: SecurityGuard; cert: Certification }
  | { kind: 'coi'; guard: SecurityGuard }
  | { kind: 'gov-id'; guard: SecurityGuard }
  | {
      kind: 'activation-pending';
      guard: SecurityGuard;
      stepKey: ActivationCredentialKey;
      label: string;
    };

const ACTIVATION_STEP_LABELS: Record<ActivationCredentialKey, string> = {
  'guard-card': 'BSIS Guard Card',
  'pta-uof': 'PTA/UOF training',
  '32-hour': '32-hour BSIS block',
};

/** Resolve a credentials-queue feed item to its guard and credential kind. */
export function resolveCredentialFeedContext(
  guards: SecurityGuard[],
  itemId: string
): CredentialFeedContext | null {
  if (isCoiApprovalItemId(itemId)) {
    const guardId = guardIdFromCoiApprovalItemId(itemId);
    const guard = guards.find((g) => g.id === guardId);
    return guard ? { kind: 'coi', guard } : null;
  }
  if (isGovIdApprovalItemId(itemId)) {
    const guardId = guardIdFromGovIdApprovalItemId(itemId);
    const guard = guards.find((g) => g.id === guardId);
    return guard ? { kind: 'gov-id', guard } : null;
  }
  const activation = parseActivationCredentialItemId(itemId);
  if (activation) {
    const guard = guards.find((g) => g.id === activation.guardId);
    if (!guard) return null;
    return {
      kind: 'activation-pending',
      guard,
      stepKey: activation.key,
      label: ACTIVATION_STEP_LABELS[activation.key],
    };
  }
  for (const guard of guards) {
    const cert = guard.certifications.find((c) => c.id === itemId);
    if (cert) return { kind: 'cert', guard, cert };
  }
  return null;
}

/** Thumbnail for credentials-queue list rows (cert photo, COI doc, or ID front). */
export function credentialFeedThumbnailUrl(guards: SecurityGuard[], itemId: string): string | undefined {
  const context = resolveCredentialFeedContext(guards, itemId);
  if (!context) return undefined;
  if (context.kind === 'cert') return resolveCertImageUrl(context.cert);
  if (context.kind === 'coi') return context.guard.insurancePolicy?.documentUrl?.trim() || undefined;
  return context.guard.idFrontUrl?.trim() || context.guard.idSelfieUrl?.trim() || undefined;
}

export function formatApprovalTimestamp(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Submitted credentials awaiting staff review — excludes guard upload-pending slots. */
export function isCredentialFeedItemAwaitingStaffReview(item: ApprovalFeedItem): boolean {
  if (item.queue !== 'credentials') return false;
  if (item.status !== 'pending' && item.status !== 'in_review') return false;
  return item.statusLabel !== CREDENTIAL_PENDING_UPLOAD_LABEL;
}

function credentialQueueFeed(guards: SecurityGuard[]): ApprovalFeedItem[] {
  return filterApprovalsFeedByQueue(
    buildStaffApprovalsFeed({ guards, clients: [], requests: [] }),
    'credentials'
  );
}

/** Activation slots awaiting guard upload — Credentials “Pending upload” tab. */
export function countPendingCredentialUploads(guards: SecurityGuard[]): number {
  return credentialQueueFeed(guards).filter(
    (item) => item.statusLabel === CREDENTIAL_PENDING_UPLOAD_LABEL
  ).length;
}

/** Credentials submitted and awaiting staff review — Credentials “Pending review” tab. */
export function countPendingCredentialReviews(guards: SecurityGuard[]): number {
  return credentialQueueFeed(guards).filter(isCredentialFeedItemAwaitingStaffReview).length;
}

/** Full open credential queue — pending upload plus pending review. */
export function countPendingCredentialApprovals(guards: SecurityGuard[]): number {
  return countPendingCredentialUploads(guards) + countPendingCredentialReviews(guards);
}

function guardIdForCredentialFeedItem(item: ApprovalFeedItem, guards: SecurityGuard[]): string | null {
  if (isCoiApprovalItemId(item.id)) return guardIdFromCoiApprovalItemId(item.id);
  if (isGovIdApprovalItemId(item.id)) return guardIdFromGovIdApprovalItemId(item.id);
  const activation = parseActivationCredentialItemId(item.id);
  if (activation) return activation.guardId;
  return guards.find((guard) => guard.certifications.some((cert) => cert.id === item.id))?.id ?? null;
}

/** Deep-link overview credential actions into the first pending credentials-queue item. */
export function resolveFirstPendingCredentialSelection(
  guards: SecurityGuard[]
): { credentialItemId: string; guardId: string } | null {
  const feed = filterApprovalsFeedByQueue(
    buildStaffApprovalsFeed({ guards, clients: [], requests: [] }),
    'credentials'
  );
  const item = feed.find((entry) => isCredentialFeedItemAwaitingStaffReview(entry));
  if (!item) return null;
  const guardId = guardIdForCredentialFeedItem(item, guards);
  if (!guardId) return null;
  return { credentialItemId: item.id, guardId };
}
