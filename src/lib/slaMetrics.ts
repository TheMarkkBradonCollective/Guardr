import type { SecurityRequest, SecurityGuard, Client, SupportTicket } from '../types';

export interface SlaMetrics {
  avgTimeToApproveHours: number;
  avgTimeToFillHours: number;
  guardNoShowRate: number;
  openJobsCount: number;
  pendingApprovalsCount: number;
  avgClientRating: number;
  jobsCompletedThisWeek: number;
  activeGuardsCount: number;
  activeClientsCount: number;
}

function hoursBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms > 0 ? ms / 3_600_000 : 0;
}

export function computeSlaMetrics(
  requests: SecurityRequest[],
  guards: SecurityGuard[],
  clients: Client[],
  tickets: SupportTicket[] = []
): SlaMetrics {
  const now = Date.now();
  const weekAgo = now - 7 * 86_400_000;

  const approvedJobs = requests.filter((r) => r.status !== 'draft' && r.status !== 'pending-review');
  const approvalTimes = requests
    .filter((r) => r.openedAt && r.startDate)
    .map((r) => hoursBetween(r.startDate, r.openedAt!));
  const fillTimes = requests
    .filter((r) => (r as SecurityRequest & { acceptedAt?: string }).acceptedAt && r.openedAt)
    .map((r) =>
      hoursBetween(r.openedAt!, (r as SecurityRequest & { acceptedAt?: string }).acceptedAt!)
    );

  const completed = requests.filter((r) => r.status === 'completed' || r.status === 'closed');
  const noShows = completed.filter((r) => (r as SecurityRequest & { noShow?: boolean }).noShow === true);
  const weekCompleted = completed.filter((r) => new Date(r.endDate).getTime() >= weekAgo);

  const ratings = clients.map((c) => c.rating).filter((r): r is number => typeof r === 'number' && r > 0);

  return {
    avgTimeToApproveHours: avg(approvalTimes),
    avgTimeToFillHours: avg(fillTimes),
    guardNoShowRate: completed.length ? noShows.length / completed.length : 0,
    openJobsCount: requests.filter((r) => r.status === 'open').length,
    pendingApprovalsCount: requests.filter((r) => r.status === 'pending-review').length,
    avgClientRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
    jobsCompletedThisWeek: weekCompleted.length,
    activeGuardsCount: guards.filter((g) => g.userStatus === 'active' && !g.isStaff).length,
    activeClientsCount: clients.filter((c) => c.accountStatus === 'active' || c.approved).length,
  };
}

function avg(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function formatSlaHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}
