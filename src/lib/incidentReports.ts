import { SecurityGuard, SecurityRequest } from '../types';

export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical';

export type IncidentCategory =
  | 'trespass'
  | 'theft'
  | 'assault'
  | 'property-damage'
  | 'medical'
  | 'fire'
  | 'disturbance'
  | 'vehicle'
  | 'suspicious-activity'
  | 'other';

export interface IncidentReportDetail {
  id: string;
  hasIncident: boolean;
  incidentType?: IncidentCategory | string;
  priority?: IncidentPriority;
  /** When the incident occurred (distinct from submission time). */
  occurredAt?: string;
  /** Specific location on site (zone, gate, floor, etc.). */
  locationOnSite?: string;
  /** What happened — narrative description. */
  description?: string;
  /** Who was involved — subjects, visitors, staff, etc. */
  partiesInvolved?: string;
  /** Witness names or descriptions. */
  witnesses?: string;
  /** Why / contributing factors / root cause. */
  causeOrTrigger?: string;
  /** How the guard responded — actions taken on scene. */
  actionsTaken?: string;
  authoritiesNotified?: boolean;
  authorityDetails?: string;
  injuryInvolved?: boolean;
  propertyDamageInvolved?: boolean;
  injuryDetails?: string;
  propertyDamageDetails?: string;
  followUpRequired?: boolean;
  followUpNotes?: string;
  evidenceNotes?: string;
  submittedAt: string;
  submittedByGuardId?: string;
  submittedByGuardName?: string;
}

export interface IncidentReportFormInput {
  incidentType: IncidentCategory;
  priority: IncidentPriority;
  occurredAt: string;
  locationOnSite: string;
  description: string;
  partiesInvolved: string;
  witnesses: string;
  causeOrTrigger: string;
  actionsTaken: string;
  authoritiesNotified: boolean;
  authorityDetails: string;
  injuryInvolved: boolean;
  propertyDamageInvolved: boolean;
  injuryDetails: string;
  propertyDamageDetails: string;
  followUpRequired: boolean;
  followUpNotes: string;
  evidenceNotes: string;
}

export interface IncidentReportViewContext {
  id: string;
  requestId: string;
  jobTitle: string;
  siteName: string;
  jobLocation: string;
  clientName: string;
  guardName: string;
  detail: IncidentReportDetail;
}

export const INCIDENT_CATEGORY_OPTIONS: { value: IncidentCategory; label: string }[] = [
  { value: 'trespass', label: 'Trespass / unauthorized entry' },
  { value: 'theft', label: 'Theft / burglary' },
  { value: 'assault', label: 'Assault / altercation' },
  { value: 'property-damage', label: 'Property damage' },
  { value: 'medical', label: 'Medical emergency' },
  { value: 'fire', label: 'Fire / hazmat' },
  { value: 'disturbance', label: 'Disturbance / noise' },
  { value: 'vehicle', label: 'Vehicle incident' },
  { value: 'suspicious-activity', label: 'Suspicious activity' },
  { value: 'other', label: 'Other' },
];

export const INCIDENT_PRIORITY_OPTIONS: { value: IncidentPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const PRIORITY_TONE: Record<IncidentPriority, 'default' | 'warning' | 'danger'> = {
  low: 'default',
  medium: 'warning',
  high: 'warning',
  critical: 'danger',
};

export function incidentPriorityTone(priority?: IncidentPriority) {
  return PRIORITY_TONE[priority ?? 'medium'];
}

export function incidentCategoryLabel(type?: string): string {
  return INCIDENT_CATEGORY_OPTIONS.find((o) => o.value === type)?.label ?? type ?? 'Incident';
}

export function incidentPriorityLabel(priority?: IncidentPriority): string {
  return INCIDENT_PRIORITY_OPTIONS.find((o) => o.value === priority)?.label ?? priority ?? 'Medium';
}

export function createIncidentReportDetail(
  input: IncidentReportFormInput,
  guard: { id: string; name: string }
): IncidentReportDetail {
  return {
    id: `inc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    hasIncident: true,
    incidentType: input.incidentType,
    priority: input.priority,
    occurredAt: input.occurredAt,
    locationOnSite: input.locationOnSite.trim() || undefined,
    description: input.description.trim(),
    partiesInvolved: input.partiesInvolved.trim() || undefined,
    witnesses: input.witnesses.trim() || undefined,
    causeOrTrigger: input.causeOrTrigger.trim() || undefined,
    actionsTaken: input.actionsTaken.trim() || undefined,
    authoritiesNotified: input.authoritiesNotified,
    authorityDetails: input.authorityDetails.trim() || undefined,
    injuryInvolved: input.injuryInvolved,
    propertyDamageInvolved: input.propertyDamageInvolved,
    injuryDetails: input.injuryDetails.trim() || undefined,
    propertyDamageDetails: input.propertyDamageDetails.trim() || undefined,
    followUpRequired: input.followUpRequired,
    followUpNotes: input.followUpNotes.trim() || undefined,
    evidenceNotes: input.evidenceNotes.trim() || undefined,
    submittedAt: new Date().toISOString(),
    submittedByGuardId: guard.id,
    submittedByGuardName: guard.name,
  };
}

export function listIncidentReportsForRequest(req: SecurityRequest): IncidentReportDetail[] {
  const fromArray = req.checkOutAudit?.incidentReports ?? [];
  if (fromArray.length > 0) return fromArray;
  const legacy = req.checkOutAudit?.incidentReport;
  if (legacy?.hasIncident) {
    return [
      {
        id: `inc-${req.id}-checkout`,
        hasIncident: true,
        incidentType: legacy.incidentType,
        priority: legacy.priority as IncidentPriority | undefined,
        occurredAt: legacy.occurredAt,
        locationOnSite: legacy.locationOnSite,
        description: legacy.description,
        partiesInvolved: legacy.partiesInvolved,
        witnesses: legacy.witnesses,
        causeOrTrigger: legacy.causeOrTrigger,
        actionsTaken: legacy.actionsTaken,
        authoritiesNotified: legacy.authoritiesNotified,
        authorityDetails: legacy.authorityDetails,
        injuryInvolved: legacy.injuryInvolved,
        propertyDamageInvolved: legacy.propertyDamageInvolved,
        injuryDetails: legacy.injuryDetails,
        propertyDamageDetails: legacy.propertyDamageDetails,
        followUpRequired: legacy.followUpRequired,
        followUpNotes: legacy.followUpNotes,
        evidenceNotes: legacy.evidenceNotes,
        submittedAt: legacy.submittedAt ?? req.checkOutAudit?.checkedAt ?? req.endDate,
        submittedByGuardId: legacy.submittedByGuardId,
        submittedByGuardName: legacy.submittedByGuardName,
      },
    ];
  }
  return [];
}

export function requestHasOpenIncident(req: SecurityRequest): boolean {
  return listIncidentReportsForRequest(req).length > 0;
}

export function buildIncidentReportViews(
  requests: SecurityRequest[],
  guards: SecurityGuard[]
): IncidentReportViewContext[] {
  const views: IncidentReportViewContext[] = [];
  for (const req of requests) {
    const guardName = guards.find((g) => g.id === req.assignedGuardId)?.name ?? 'Guard';
    const site = req.siteName || req.location;
    for (const detail of listIncidentReportsForRequest(req)) {
      views.push({
        id: detail.id,
        requestId: req.id,
        jobTitle: req.title,
        siteName: site,
        jobLocation: req.location,
        clientName: req.clientName,
        guardName: detail.submittedByGuardName ?? guardName,
        detail,
      });
    }
  }
  return views.sort(
    (a, b) => new Date(b.detail.submittedAt).getTime() - new Date(a.detail.submittedAt).getTime()
  );
}

export function incidentSummaryLine(detail: IncidentReportDetail): string {
  const parts = [
    incidentCategoryLabel(detail.incidentType),
    detail.description?.slice(0, 120),
  ].filter(Boolean);
  return parts.join(' — ');
}

export function incidentChatSummary(detail: IncidentReportDetail, guardName: string, location: string): string {
  const when = detail.occurredAt
    ? new Date(detail.occurredAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'time not specified';
  const where = detail.locationOnSite ? `${location} (${detail.locationOnSite})` : location;
  return [
    `Incident reported by ${guardName}`,
    `Type: ${incidentCategoryLabel(detail.incidentType)} · ${incidentPriorityLabel(detail.priority)} priority`,
    `When: ${when} · Where: ${where}`,
    detail.description ? `What: ${detail.description}` : undefined,
    detail.actionsTaken ? `Actions taken: ${detail.actionsTaken}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');
}

export function emptyIncidentFormInput(): IncidentReportFormInput {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return {
    incidentType: 'suspicious-activity',
    priority: 'medium',
    occurredAt: local,
    locationOnSite: '',
    description: '',
    partiesInvolved: '',
    witnesses: '',
    causeOrTrigger: '',
    actionsTaken: '',
    authoritiesNotified: false,
    authorityDetails: '',
    injuryInvolved: false,
    propertyDamageInvolved: false,
    injuryDetails: '',
    propertyDamageDetails: '',
    followUpRequired: false,
    followUpNotes: '',
    evidenceNotes: '',
  };
}
