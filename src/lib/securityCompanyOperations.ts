import type { Client, SecurityGuard, SecurityRequest } from '../types';
import {
  CLIENT_SHIFT_PHASE_LABELS,
  clientShiftTimerLabel,
  getClientTrackableJobs,
  guardForRequest,
  inferClientShiftPhase,
  type ClientShiftPhase,
} from './clientShift';
import { mergeJobSlots, teamRosterSummary } from './guardTeams';

export type SecurityCompanyShiftRow = {
  job: SecurityRequest;
  guard: SecurityGuard | null;
  phase: ClientShiftPhase;
  timerLabel: string | null;
  slotLabel?: string;
};

export function securityCompanyOperationsRows(
  clientId: string,
  requests: SecurityRequest[],
  guards: SecurityGuard[]
): SecurityCompanyShiftRow[] {
  const mine = requests.filter((r) => r.clientId === clientId);
  const trackable = getClientTrackableJobs(mine);
  const rows: SecurityCompanyShiftRow[] = [];

  for (const job of trackable) {
    const slots = mergeJobSlots(job, job.guardSlots);
    const approvedSlots = slots.filter((s) => s.guardId && s.status === 'approved');
    if (approvedSlots.length > 1) {
      for (const slot of approvedSlots) {
        const guard = guards.find((g) => g.id === slot.guardId) ?? null;
        rows.push({
          job,
          guard,
          phase: inferClientShiftPhase(job),
          timerLabel: clientShiftTimerLabel(job),
          slotLabel: slot.isLead ? `Lead slot ${slot.slotIndex}` : `Slot ${slot.slotIndex}`,
        });
      }
      continue;
    }
    rows.push({
      job,
      guard: guardForRequest(guards, job),
      phase: inferClientShiftPhase(job),
      timerLabel: clientShiftTimerLabel(job),
    });
  }

  return rows.sort((a, b) => new Date(a.job.startDate).getTime() - new Date(b.job.startDate).getTime());
}

export function securityCompanyOperationsSummary(
  clientId: string,
  requests: SecurityRequest[]
): { live: number; scheduled: number; onSite: number } {
  const rows = securityCompanyOperationsRows(clientId, requests, []);
  let live = 0;
  let scheduled = 0;
  let onSite = 0;
  for (const row of rows) {
    if (row.phase === 'on-duty') live += 1;
    else if (row.phase === 'scheduled' || row.phase === 'en-route') scheduled += 1;
    else if (row.phase === 'on-site') onSite += 1;
  }
  return { live, scheduled, onSite };
}

export function formatOperationsPhaseLabel(phase: ClientShiftPhase): string {
  return CLIENT_SHIFT_PHASE_LABELS[phase];
}

export function upcomingOverflowJobs(
  clientId: string,
  requests: SecurityRequest[]
): SecurityRequest[] {
  return requests
    .filter((r) => r.clientId === clientId && r.status === 'open')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

export function openJobRosterGap(job: SecurityRequest): { filled: number; total: number; open: number } {
  const summary = teamRosterSummary(job.guardSlots, job.guardsNeeded ?? 1);
  return { filled: summary.filled, total: summary.total, open: summary.open };
}
