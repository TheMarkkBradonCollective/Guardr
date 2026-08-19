import type { UserNotification } from '../types';
import type { StaffSection } from './staffOps';
import type { OpsDispute, OpsIncident, OpsShiftViolation } from './staffOps';
import type { SecurityGuard, Client } from '../types';
import {
  buildStaffNavOpenItemIds,
  loadStaffOpsNavViewState,
  syncStaffNavHandledElsewhere,
  type StaffNotifiableSection,
  type StaffOpsNavViewState,
} from './staffOpsNavNotifications';

const READ_STORAGE_KEY = (staffId: string) => `guardr-staff-inbox-read-${staffId}`;

export function loadStaffInboxReadAt(staffId: string): Record<string, string> {
  if (!staffId || typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY(staffId));
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function markStaffInboxNotificationRead(staffId: string, notificationId: string): void {
  if (!staffId || typeof localStorage === 'undefined') return;
  const read = loadStaffInboxReadAt(staffId);
  read[notificationId] = new Date().toISOString();
  try {
    localStorage.setItem(READ_STORAGE_KEY(staffId), JSON.stringify(read));
  } catch {
    /* ignore */
  }
}

function staffSectionUrl(section: StaffSection): string {
  return `/staff/${section}`;
}

function withReadState(
  staffId: string,
  notification: UserNotification,
  readAtById: Record<string, string>
): UserNotification {
  const readAt = readAtById[notification.id];
  return readAt ? { ...notification, readAt } : notification;
}

function openViolationNotification(
  staffId: string,
  v: OpsShiftViolation,
  readAtById: Record<string, string>
): UserNotification {
  return withReadState(staffId, {
    id: `staff-ops-violation-open-${v.id}`,
    userId: staffId,
    type: 'staff.violation.open',
    title: 'Shift violation needs review',
    body: `${v.label} — ${v.jobTitle}`,
    url: staffSectionUrl('violations'),
    requestId: v.requestId,
    createdAt: v.createdAt,
    metadata: { section: 'violations', itemId: v.id },
  }, readAtById);
}

function handledViolationNotification(
  staffId: string,
  itemId: string,
  readAtById: Record<string, string>
): UserNotification {
  const now = new Date().toISOString();
  return withReadState(staffId, {
    id: `staff-ops-violation-handled-${itemId}`,
    userId: staffId,
    type: 'staff.violation.handled',
    title: 'Violation handled',
    body: 'Another staff member resolved this shift violation.',
    url: staffSectionUrl('violations'),
    createdAt: now,
    metadata: { section: 'violations', itemId, handledByOther: true },
  }, readAtById);
}

function openDisputeNotification(
  staffId: string,
  d: OpsDispute,
  readAtById: Record<string, string>
): UserNotification {
  return withReadState(staffId, {
    id: `staff-ops-dispute-open-${d.id}`,
    userId: staffId,
    type: 'staff.dispute.open',
    title: d.type === 'overtime' ? 'Overtime dispute' : 'Dispute needs review',
    body: `${d.jobTitle} — ${d.guardName} vs ${d.clientName}`,
    url: staffSectionUrl('disputes'),
    requestId: d.requestId,
    ticketId: d.ticketId,
    createdAt: d.openedAt,
    metadata: { section: 'disputes', itemId: d.id },
  }, readAtById);
}

function handledDisputeNotification(
  staffId: string,
  itemId: string,
  readAtById: Record<string, string>
): UserNotification {
  const now = new Date().toISOString();
  return withReadState(staffId, {
    id: `staff-ops-dispute-handled-${itemId}`,
    userId: staffId,
    type: 'staff.dispute.handled',
    title: 'Dispute closed',
    body: 'Another staff member closed this overtime dispute.',
    url: staffSectionUrl('disputes'),
    createdAt: now,
    metadata: { section: 'disputes', itemId, handledByOther: true },
  }, readAtById);
}

function openIncidentNotification(
  staffId: string,
  inc: OpsIncident,
  readAtById: Record<string, string>
): UserNotification {
  return withReadState(staffId, {
    id: `staff-ops-incident-open-${inc.id}`,
    userId: staffId,
    type: 'staff.incident.open',
    title: 'Incident reported',
    body: `${inc.severity} — ${inc.location}`,
    url: staffSectionUrl('incidents'),
    requestId: inc.requestId,
    createdAt: inc.occurredAt ?? inc.timestamp,
    metadata: { section: 'incidents', itemId: inc.id },
  }, readAtById);
}

function genericOpenNotification(
  staffId: string,
  section: StaffNotifiableSection,
  itemId: string,
  title: string,
  body: string,
  createdAt: string,
  readAtById: Record<string, string>,
  extra?: Pick<UserNotification, 'requestId' | 'ticketId' | 'guardId'>
): UserNotification {
  return withReadState(staffId, {
    id: `staff-ops-${section}-open-${itemId}`,
    userId: staffId,
    type: `staff.${section}.open`,
    title,
    body,
    url: staffSectionUrl(section),
    createdAt,
    metadata: { section, itemId },
    ...extra,
  }, readAtById);
}

function handledNotification(
  staffId: string,
  section: StaffNotifiableSection,
  itemId: string,
  title: string,
  body: string,
  readAtById: Record<string, string>
): UserNotification {
  const now = new Date().toISOString();
  return withReadState(staffId, {
    id: `staff-ops-${section}-handled-${itemId}`,
    userId: staffId,
    type: `staff.${section}.handled`,
    title,
    body,
    url: staffSectionUrl(section),
    createdAt: now,
    metadata: { section, itemId, handledByOther: true },
  }, readAtById);
}

export interface BuildStaffOpsInboxInput {
  staffId: string;
  guards: SecurityGuard[];
  clients: Client[];
  violations: OpsShiftViolation[];
  disputes: OpsDispute[];
  incidents: OpsIncident[];
  openItemsBySection: Partial<Record<StaffNotifiableSection, string[]>>;
  viewState?: StaffOpsNavViewState;
}

/** Build clickable staff-ops rows for the account notification bell. */
export function buildStaffOpsInboxNotifications(input: BuildStaffOpsInboxInput): UserNotification[] {
  const {
    staffId,
    guards,
    clients,
    violations,
    disputes,
    incidents,
    openItemsBySection,
    viewState = loadStaffOpsNavViewState(staffId),
  } = input;

  const readAtById = loadStaffInboxReadAt(staffId);
  const rows: UserNotification[] = [];

  for (const v of violations.filter((x) => x.needsReview)) {
    rows.push(openViolationNotification(staffId, v, readAtById));
  }
  for (const itemId of viewState.handledElsewhere.violations ?? []) {
    rows.push(handledViolationNotification(staffId, itemId, readAtById));
  }

  for (const d of disputes.filter((x) => x.status === 'open' || x.status === 'held')) {
    rows.push(openDisputeNotification(staffId, d, readAtById));
  }
  for (const itemId of viewState.handledElsewhere.disputes ?? []) {
    rows.push(handledDisputeNotification(staffId, itemId, readAtById));
  }

  for (const inc of incidents.filter((i) => i.status !== 'resolved')) {
    rows.push(openIncidentNotification(staffId, inc, readAtById));
  }
  for (const itemId of viewState.handledElsewhere.incidents ?? []) {
    rows.push(
      handledNotification(
        staffId,
        'incidents',
        itemId,
        'Incident resolved',
        'Another staff member resolved this incident.',
        readAtById
      )
    );
  }

  const pendingGuards = guards.filter((g) => !g.isStaff && openItemsBySection.guards?.includes(g.id));
  for (const g of pendingGuards) {
    rows.push(
      genericOpenNotification(
        staffId,
        'guards',
        g.id,
        'Guard application pending',
        g.name || g.email,
        new Date().toISOString(),
        readAtById,
        { guardId: g.id }
      )
    );
  }

  const pendingClients = clients.filter((c) => openItemsBySection.clients?.includes(c.id));
  for (const c of pendingClients) {
    rows.push(
      genericOpenNotification(
        staffId,
        'clients',
        c.id,
        'Client account pending',
        c.name || c.email,
        new Date().toISOString(),
        readAtById
      )
    );
  }

  for (const appId of openItemsBySection.applications ?? []) {
    if (rows.some((r) => r.metadata?.itemId === appId.replace(/^(guard|client)-app-/, ''))) continue;
    rows.push(
      genericOpenNotification(
        staffId,
        'applications',
        appId,
        'Account application',
        'New guard or customer application needs review.',
        new Date().toISOString(),
        readAtById
      )
    );
  }

  return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function isStaffOpsInboxNotification(notification: Pick<UserNotification, 'type'>): boolean {
  return notification.type.startsWith('staff.');
}

export function staffSectionFromOpsNotification(
  notification: Pick<UserNotification, 'type' | 'metadata' | 'url'>
): StaffSection | null {
  const section = notification.metadata?.section;
  if (typeof section === 'string') return section as StaffSection;
  const match = notification.url?.match(/^\/staff\/([a-z-]+)/);
  return match ? (match[1] as StaffSection) : null;
}

/** Sync handled-elsewhere state from open-item snapshots (call before building inbox). */
export function staffOpsInboxViewState(
  staffId: string,
  openItemsBySection: Partial<Record<StaffNotifiableSection, string[]>>,
  activeSection: StaffSection
): StaffOpsNavViewState {
  let state = loadStaffOpsNavViewState(staffId);
  for (const section of Object.keys(openItemsBySection) as StaffNotifiableSection[]) {
    state = syncStaffNavHandledElsewhere(
      state,
      section,
      openItemsBySection[section] ?? [],
      activeSection
    );
  }
  return state;
}

export { buildStaffNavOpenItemIds };
