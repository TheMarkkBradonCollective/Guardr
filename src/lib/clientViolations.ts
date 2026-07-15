import type { SecurityRequest } from '../types';

export type ClientViolationTarget = 'guard' | 'job';

export type GuardViolationCategory =
  | 'late-arrival'
  | 'no-show'
  | 'uniform'
  | 'unprofessional'
  | 'left-post'
  | 'post-orders'
  | 'self-audit'
  | 'other';

export type JobViolationCategory =
  | 'site-access'
  | 'equipment'
  | 'briefing'
  | 'scheduling'
  | 'other';

export interface ClientViolationReport {
  id: string;
  target: ClientViolationTarget;
  category: GuardViolationCategory | JobViolationCategory | string;
  description: string;
  reportedAt: string;
  reportedByClientId: string;
  reportedByClientName?: string;
  /** Set when target is guard — the guard being reported. */
  guardId?: string;
}

export const GUARD_VIOLATION_OPTIONS: { value: GuardViolationCategory; label: string }[] = [
  { value: 'late-arrival', label: 'Late arrival' },
  { value: 'no-show', label: 'No-show / abandoned post' },
  { value: 'uniform', label: 'Uniform or appearance' },
  { value: 'unprofessional', label: 'Unprofessional conduct' },
  { value: 'left-post', label: 'Left post early' },
  { value: 'post-orders', label: 'Failed to follow post orders' },
  { value: 'self-audit', label: 'Self-audit / check-in issue' },
  { value: 'other', label: 'Other guard issue' },
];

export const JOB_VIOLATION_OPTIONS: { value: JobViolationCategory; label: string }[] = [
  { value: 'site-access', label: 'Site access problem' },
  { value: 'equipment', label: 'Missing equipment or gear' },
  { value: 'briefing', label: 'Incorrect or incomplete briefing' },
  { value: 'scheduling', label: 'Scheduling or coverage issue' },
  { value: 'other', label: 'Other job issue' },
];

export function clientViolationCategoryLabel(
  target: ClientViolationTarget,
  category?: string
): string {
  const options = target === 'guard' ? GUARD_VIOLATION_OPTIONS : JOB_VIOLATION_OPTIONS;
  return options.find((o) => o.value === category)?.label ?? category ?? 'Violation';
}

export function listClientViolationReports(request: SecurityRequest): ClientViolationReport[] {
  return request.clientViolationReports ?? [];
}

export function listGuardViolationReportsForGuard(
  guardId: string,
  requests: SecurityRequest[]
): ClientViolationReport[] {
  return requests.flatMap((req) =>
    (req.clientViolationReports ?? []).filter(
      (v) => v.target === 'guard' && v.guardId === guardId
    )
  );
}

export function countGuardViolationReports(
  guardId: string,
  requests: SecurityRequest[]
): number {
  return listGuardViolationReportsForGuard(guardId, requests).length;
}

export function createClientViolationReport(input: {
  target: ClientViolationTarget;
  category: string;
  description: string;
  reportedByClientId: string;
  reportedByClientName?: string;
  guardId?: string;
}): ClientViolationReport {
  return {
    id: `cvr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    target: input.target,
    category: input.category,
    description: input.description.trim(),
    reportedAt: new Date().toISOString(),
    reportedByClientId: input.reportedByClientId,
    reportedByClientName: input.reportedByClientName,
    guardId: input.guardId,
  };
}

export function canClientReportViolation(request: SecurityRequest): boolean {
  return ['accepted', 'in-progress', 'completed', 'closed'].includes(request.status);
}
