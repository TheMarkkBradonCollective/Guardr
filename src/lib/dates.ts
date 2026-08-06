/** Shared date/time helpers for shift scheduling */

export function fromDatetimeLocal(local: string): string {
  return new Date(local).toISOString();
}

export function toDatetimeLocal(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function computeDurationHours(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (end <= start) return 0;
  return Math.round(((end - start) / 3600000) * 100) / 100;
}

export function formatDuration(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (minutes === 0) return `${wholeHours}h`;
  if (wholeHours === 0) return `${minutes}m`;
  return `${wholeHours}h ${minutes}m`;
}

export function formatShiftRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };

  const sameDay = start.toDateString() === end.toDateString();
  const startStr = `${start.toLocaleDateString('en-US', dateOpts)}, ${start.toLocaleTimeString('en-US', timeOpts)}`;
  if (sameDay) {
    return `${startStr} – ${end.toLocaleTimeString('en-US', timeOpts)}`;
  }
  const endStr = `${end.toLocaleDateString('en-US', dateOpts)}, ${end.toLocaleTimeString('en-US', timeOpts)}`;
  return `${startStr} – ${endStr}`;
}

export function getDefaultShiftStart(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return toDatetimeLocal(d);
}

export function getDefaultShiftEnd(startLocal: string, hours = 8): string {
  const start = new Date(startLocal);
  return toDatetimeLocal(new Date(start.getTime() + hours * 3600000));
}
