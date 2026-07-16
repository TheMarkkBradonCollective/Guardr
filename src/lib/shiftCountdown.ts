/** Format time until a shift in a human-friendly way. */
export function formatTimeUntilShift(startDate: string): string {
  const now = new Date();
  const start = new Date(startDate);
  const diffMs = start.getTime() - now.getTime();
  if (diffMs <= 0) return 'Now';
  const diffHours = diffMs / 3_600_000;
  if (diffHours < 1) {
    const mins = Math.round(diffMs / 60_000);
    return `In ${mins} min${mins === 1 ? '' : 's'}`;
  }
  if (diffHours < 24) {
    const hours = Math.floor(diffHours);
    const mins = Math.round((diffHours - hours) * 60);
    return mins > 0 ? `In ${hours}h ${mins}m` : `In ${hours}h`;
  }
  return (
    start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' at ' +
    start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}
