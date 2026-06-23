import { computeDurationHours, formatDuration } from './dates';
import { shiftClockOutClosesAt } from './shiftWindow';

export interface ShiftPeriodSnapshot {
  totalMs: number;
  totalLabel: string;
  remainingMs: number;
  remainingLabel: string;
  elapsedMs: number;
  elapsedLabel: string;
  progressPct: number;
  startsInMs: number;
  startsInLabel: string | null;
  windowEndLabel: string;
}

function formatPeriodMs(ms: number): string {
  if (ms <= 0) return '0m';
  const totalMinutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatWindowEnd(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function getShiftPeriodSnapshot(
  startDate: string,
  endDate: string,
  now = new Date()
): ShiftPeriodSnapshot {
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const windowEndMs = shiftClockOutClosesAt(endDate).getTime();
  const nowMs = now.getTime();
  const totalMs = Math.max(0, endMs - startMs);
  const totalHours = computeDurationHours(startDate, endDate);
  const totalLabel = formatDuration(totalHours);

  const startsInMs = Math.max(0, startMs - nowMs);
  const startsInLabel = startsInMs > 0 ? formatPeriodMs(startsInMs) : null;

  const elapsedMs =
    nowMs <= startMs ? 0 : Math.min(totalMs, Math.max(0, nowMs - startMs));
  const remainingMs =
    nowMs >= endMs ? 0 : Math.max(0, endMs - nowMs);

  const progressPct =
    totalMs <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));

  return {
    totalMs,
    totalLabel,
    remainingMs,
    remainingLabel: formatPeriodMs(remainingMs),
    elapsedMs,
    elapsedLabel: formatPeriodMs(elapsedMs),
    progressPct,
    startsInMs,
    startsInLabel,
    windowEndLabel: formatWindowEnd(new Date(windowEndMs)),
  };
}
