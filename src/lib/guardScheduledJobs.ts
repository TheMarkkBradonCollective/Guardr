import type { GuardJobView } from './guardJobView';

const MS_IN_HOUR = 3_600_000;
const WITHIN_24H_MS = 24 * MS_IN_HOUR;

export function formatScheduledJobWhen(startDate: string, now = new Date()): string {
  const startMs = new Date(startDate).getTime();
  if (!Number.isFinite(startMs)) return '';
  const diffMs = startMs - now.getTime();
  if (diffMs <= 0) return 'Starting now';
  if (diffMs <= WITHIN_24H_MS) {
    const totalMinutes = Math.ceil(diffMs / 60_000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) return `In ${hours}h ${minutes}m`;
    if (hours > 0) return `In ${hours}h`;
    return `In ${minutes}m`;
  }
  return new Date(startDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isScheduledJobStartingSoon(startDate: string, now = new Date()): boolean {
  const startMs = new Date(startDate).getTime();
  if (!Number.isFinite(startMs)) return false;
  const diffMs = startMs - now.getTime();
  return diffMs <= WITHIN_24H_MS;
}

export function sortScheduledJobs(jobs: GuardJobView[]): GuardJobView[] {
  return [...jobs].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
}
