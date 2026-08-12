import type { StaffSection } from './staffOps';
import type {
  Client,
  GuardPayoutInvoice,
  JobChatThread,
  SecurityGuard,
  SecurityRequest,
  SupportTicket,
} from '../types';
import {
  buildIncidents,
  buildStaffShiftViolations,
  getPendingClientAccounts,
  getPendingGuardAccounts,
  type OpsDispute,
  type OpsIncident,
} from './staffOps';
import { isGuardAccountPending } from './accountStatus';
import { openGuardPayoutInvoices } from './guardPayoutInvoiceStorage';


/** Dot on staff nav — unread work, or closed by another staff member since your last visit. */
export type StaffNavNotificationKind = 'unread' | 'handled-by-other';

export interface StaffNavNotificationSignal {
  kind: StaffNavNotificationKind;
}

/** Sections that show notification dots (not numeric counts). */
export type StaffNotifiableSection = Extract<
  StaffSection,
  | 'applications'
  | 'credentials'
  | 'guards'
  | 'clients'
  | 'jobs'
  | 'incidents'
  | 'violations'
  | 'disputes'
  | 'support'
  | 'messages'
  | 'payments'
>;

export const STAFF_NOTIFIABLE_SECTIONS: StaffNotifiableSection[] = [
  'applications',
  'credentials',
  'guards',
  'clients',
  'jobs',
  'incidents',
  'violations',
  'disputes',
  'support',
  'messages',
  'payments',
];

interface SectionViewSnapshot {
  visitedAt: string;
  openItemIds: string[];
}

export interface StaffOpsNavViewState {
  sections: Partial<Record<StaffNotifiableSection, SectionViewSnapshot>>;
  /** Closed since last visit — likely handled by another staff member. */
  handledElsewhere: Partial<Record<StaffNotifiableSection, string[]>>;
  /** Item ids resolved by this staff member in the current session. */
  selfHandledItemIds: string[];
}

function storageKey(staffId: string): string {
  return `guardr-staff-nav-views-${staffId}`;
}

export function emptyStaffOpsNavViewState(): StaffOpsNavViewState {
  return { sections: {}, handledElsewhere: {}, selfHandledItemIds: [] };
}

export function loadStaffOpsNavViewState(staffId: string): StaffOpsNavViewState {
  if (!staffId || typeof localStorage === 'undefined') return emptyStaffOpsNavViewState();
  try {
    const raw = localStorage.getItem(storageKey(staffId));
    if (!raw) return emptyStaffOpsNavViewState();
    const parsed = JSON.parse(raw) as StaffOpsNavViewState;
    return {
      sections: parsed.sections ?? {},
      handledElsewhere: parsed.handledElsewhere ?? {},
      selfHandledItemIds: Array.isArray(parsed.selfHandledItemIds) ? parsed.selfHandledItemIds : [],
    };
  } catch {
    return emptyStaffOpsNavViewState();
  }
}

export function saveStaffOpsNavViewState(staffId: string, state: StaffOpsNavViewState): void {
  if (!staffId || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(storageKey(staffId), JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function recordStaffSelfHandledItem(
  state: StaffOpsNavViewState,
  itemId: string
): StaffOpsNavViewState {
  if (state.selfHandledItemIds.includes(itemId)) return state;
  return { ...state, selfHandledItemIds: [...state.selfHandledItemIds, itemId] };
}

/** Call when staff opens a section — marks current open items as seen. */
export function markStaffSectionViewed(
  state: StaffOpsNavViewState,
  section: StaffNotifiableSection,
  currentOpenItemIds: string[]
): StaffOpsNavViewState {
  const sortedOpen = [...currentOpenItemIds].sort();
  const nextHandled = { ...state.handledElsewhere };
  delete nextHandled[section];
  return {
    ...state,
    handledElsewhere: nextHandled,
    sections: {
      ...state.sections,
      [section]: { visitedAt: new Date().toISOString(), openItemIds: sortedOpen },
    },
  };
}

/** Detect items that closed while staff was away — add to handledElsewhere. */
export function syncStaffNavHandledElsewhere(
  state: StaffOpsNavViewState,
  section: StaffNotifiableSection,
  currentOpenItemIds: string[],
  activeSection: StaffSection
): StaffOpsNavViewState {
  if (activeSection === section) return state;
  const snapshot = state.sections[section];
  if (!snapshot) return state;
  const openSet = new Set(currentOpenItemIds);
  const closedSinceVisit = snapshot.openItemIds.filter(
    (id) => !openSet.has(id) && !state.selfHandledItemIds.includes(id)
  );
  if (closedSinceVisit.length === 0) return state;
  const existing = new Set(state.handledElsewhere[section] ?? []);
  for (const id of closedSinceVisit) existing.add(id);
  return {
    ...state,
    handledElsewhere: { ...state.handledElsewhere, [section]: [...existing] },
  };
}

export function computeStaffNavNotification(
  state: StaffOpsNavViewState,
  section: StaffNotifiableSection,
  currentOpenItemIds: string[]
): StaffNavNotificationSignal | undefined {
  const handled = state.handledElsewhere[section] ?? [];
  if (handled.length > 0) return { kind: 'handled-by-other' };

  const openIds = currentOpenItemIds;
  if (openIds.length === 0) return undefined;

  const snapshot = state.sections[section];
  if (!snapshot) return { kind: 'unread' };

  const seen = new Set(snapshot.openItemIds);
  const hasNew = openIds.some((id) => !seen.has(id));
  return hasNew ? { kind: 'unread' } : undefined;
}

export function computeStaffNavNotifications(
  state: StaffOpsNavViewState,
  openItemsBySection: Partial<Record<StaffNotifiableSection, string[]>>
): Partial<Record<StaffNotifiableSection, StaffNavNotificationSignal>> {
  const out: Partial<Record<StaffNotifiableSection, StaffNavNotificationSignal>> = {};
  for (const section of STAFF_NOTIFIABLE_SECTIONS) {
    const signal = computeStaffNavNotification(state, section, openItemsBySection[section] ?? []);
    if (signal) out[section] = signal;
  }
  return out;
}

function isOpenDisputeStatus(status: OpsDispute['status']): boolean {
  return status === 'open' || status === 'held';
}

/** Stable open-item ids per staff nav section — drives notification dots. */
export function buildStaffNavOpenItemIds(input: {
  guards: SecurityGuard[];
  clients: Client[];
  requests: SecurityRequest[];
  disputes: OpsDispute[];
  supportTickets: SupportTicket[];
  jobChatThreads: JobChatThread[];
  guardPayoutInvoices: GuardPayoutInvoice[];
}): Partial<Record<StaffNotifiableSection, string[]>> {
  const { guards, clients, requests, disputes, supportTickets, jobChatThreads, guardPayoutInvoices } =
    input;
  const fieldGuards = guards.filter((g) => !g.isStaff);
  const incidents = buildIncidents(requests, guards);
  const violations = buildStaffShiftViolations(requests, guards);

  const pendingGuardApps = fieldGuards.filter((g) => isGuardAccountPending(g)).map((g) => `guard-app-${g.id}`);
  const pendingClientApps = getPendingClientAccounts(clients).map((c) => `client-app-${c.id}`);

  const credentialIds = guards.flatMap((g) =>
    g.certifications
      .filter((c) => c.status === 'pending')
      .map((c) => `${g.id}:${c.id}`)
  );

  return {
    applications: [...pendingGuardApps, ...pendingClientApps],
    credentials: credentialIds,
    guards: getPendingGuardAccounts(fieldGuards).map((g) => g.id),
    clients: getPendingClientAccounts(clients).map((c) => c.id),
    jobs: requests
      .filter((r) => ['pending-review', 'open', 'accepted', 'in-progress'].includes(r.status))
      .map((r) => r.id),
    incidents: incidents.filter((i: OpsIncident) => i.status !== 'resolved').map((i) => i.id),
    violations: violations.filter((v) => v.needsReview).map((v) => v.id),
    disputes: disputes.filter((d) => isOpenDisputeStatus(d.status)).map((d) => d.id),
    support: supportTickets.filter((t) => t.status !== 'resolved').map((t) => t.id),
    messages: jobChatThreads.filter((t) => t.status === 'active').map((t) => t.id),
    payments: openGuardPayoutInvoices(guardPayoutInvoices).map((inv) => inv.id),
  };
}
