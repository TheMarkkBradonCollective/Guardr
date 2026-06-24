import React, { useMemo } from 'react';
import devNotesMarkdown from '../../../docs/DEV-UPDATES.md?raw';
import { MarkdownDoc } from './MarkdownDoc';
import { AppScreen, AppScreenTitle } from '../ui/app/AppPrimitives';

/** Hour-of-day commit activity (0–23) parsed from dev notes time table rows. */
function parseDevActivityGrid(markdown: string): number[] {
  const hours = Array.from({ length: 24 }, () => 0);
  const timeRow = /\|\s*(\d{1,2}):(\d{2})\s*(AM|PM)/gi;
  let match: RegExpExecArray | null;
  while ((match = timeRow.exec(markdown)) !== null) {
    let hour = Number(match[1]) % 12;
    if (match[3].toUpperCase() === 'PM') hour += 12;
    if (match[3].toUpperCase() === 'AM' && Number(match[1]) === 12) hour = 0;
    hours[hour] += 1;
  }
  return hours;
}

function DevActivityGrid({ hours }: { hours: number[] }) {
  const max = Math.max(1, ...hours);
  const labels = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];
  return (
    <div className="mb-8 rounded-xl border border-brand-border bg-brand-surface-elevated p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted mb-1">
        Dev activity by hour
      </p>
      <p className="text-xs text-brand-text-muted mb-4 leading-relaxed">
        When commits land during the week — similar to rush-hour charts. Peaks show when Cursor and Markeith White are most active.
      </p>
      <div className="flex items-end gap-1 h-24">
        {hours.map((count, hour) => (
          <div key={hour} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div
              className="w-full rounded-t bg-brand-primary/80 transition-all"
              style={{ height: `${Math.max(8, (count / max) * 100)}%`, opacity: count > 0 ? 1 : 0.15 }}
              title={`${hour}:00 — ${count} commit${count === 1 ? '' : 's'}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-brand-text-muted px-0.5">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

export function DevNotesPage() {
  const activityHours = useMemo(() => parseDevActivityGrid(devNotesMarkdown), []);

  return (
    <AppScreen className="h-full overflow-y-auto overscroll-contain max-w-3xl">
      <AppScreenTitle>Dev notes</AppScreenTitle>
      <div className="px-4 pb-8">
        <DevActivityGrid hours={activityHours} />
        <MarkdownDoc source={devNotesMarkdown} />
      </div>
    </AppScreen>
  );
}
