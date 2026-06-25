import React, { useMemo } from 'react';
import devNotesMarkdown from '../../../docs/DEV-UPDATES.md?raw';
import { MarkdownDoc } from './MarkdownDoc';
import { AppScreen, AppScreenTitle } from '../ui/app/AppPrimitives';

const MILESTONES_HEADING = '## Major platform milestones';

function parseTimeToHour(h: number, _m: number, ampm: string): number {
  let hour = h % 12;
  const mer = ampm.toUpperCase();
  if (mer === 'PM') hour += 12;
  if (mer === 'AM' && h === 12) hour = 0;
  return hour;
}

/** Hour-of-day commit activity (0–23) parsed from dev notes tables and section times. */
export function parseDevActivityGrid(markdown: string): number[] {
  const hours = Array.from({ length: 24 }, () => 0);
  const add = (h: number, m: number, ampm: string, count = 1) => {
    hours[parseTimeToHour(h, m, ampm)] += count;
  };

  let sectionHour: number | null = null;

  for (const line of markdown.split('\n')) {
    const activity = line.match(/\*\*Activity:\*\*\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (activity) {
      sectionHour = parseTimeToHour(Number(activity[1]), Number(activity[2]), activity[3]);
    }

    const section = line.match(/^###\s+.+\((\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (section) {
      sectionHour = parseTimeToHour(Number(section[1]), Number(section[2]), section[3]);
    }

    if (line.match(/^\|\s*Time\s*\|/i) || line.match(/^\|\s*[-:| ]+\|/)) continue;

    const boldTime = line.match(/^\|\s*\*{0,2}(\d{1,2}):(\d{2})\s*(AM|PM)\*{0,2}\s*\|/i);
    if (boldTime) {
      add(Number(boldTime[1]), Number(boldTime[2]), boldTime[3]);
      continue;
    }

    const plainTime = line.match(/^\|\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*\|/i);
    if (plainTime) {
      add(Number(plainTime[1]), Number(plainTime[2]), plainTime[3]);
      continue;
    }

    const range = line.match(/^\|\s*(\d{1,2}):(\d{2})[–-](\d{1,2}):(\d{2})\s*(AM|PM)\s*\|/i);
    if (range) {
      add(Number(range[1]), Number(range[2]), range[5]);
      add(Number(range[3]), Number(range[4]), range[5]);
      continue;
    }

    if (line.startsWith('- ') && sectionHour !== null) {
      hours[sectionHour] += 1;
    }
  }

  return hours;
}

function splitDevNotesMarkdown(markdown: string) {
  const start = markdown.indexOf(MILESTONES_HEADING);
  if (start < 0) {
    return { beforeMilestones: markdown, milestones: '', afterMilestones: '' };
  }

  const sectionEnd = markdown.indexOf('\n---\n', start + MILESTONES_HEADING.length);
  const milestonesEnd = sectionEnd >= 0 ? sectionEnd : markdown.length;

  return {
    beforeMilestones: markdown.slice(0, start).trimEnd(),
    milestones: markdown.slice(start, milestonesEnd).trimEnd(),
    afterMilestones: (sectionEnd >= 0 ? markdown.slice(sectionEnd) : '').trimStart(),
  };
}

function DevActivityGrid({ hours }: { hours: number[] }) {
  const max = Math.max(1, ...hours);
  const labels = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];
  const barMaxPx = 88;

  return (
    <div className="mb-8 rounded-xl border border-brand-border bg-brand-surface-elevated p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted mb-1">
        Dev activity by hour
      </p>
      <p className="text-xs text-brand-text-muted mb-4 leading-relaxed">
        When commits land during the week — similar to rush-hour charts. Peaks show when Cursor and Markeith White are most active.
      </p>
      <div className="flex items-end gap-1 h-28">
        {hours.map((count, hour) => {
          const barPx = count > 0 ? Math.max(10, Math.round((count / max) * barMaxPx)) : 4;
          return (
            <div
              key={hour}
              className="flex-1 h-full flex flex-col justify-end items-center min-w-0"
              title={`${hour}:00 — ${count} commit${count === 1 ? '' : 's'}`}
            >
              {count > 0 && (
                <span
                  className="mb-1 w-2 h-2 shrink-0 rounded-full bg-brand-primary ring-2 ring-brand-primary/25"
                  aria-hidden
                />
              )}
              <div
                className="w-full rounded-t bg-brand-primary/80 transition-all"
                style={{
                  height: `${barPx}px`,
                  opacity: count > 0 ? 1 : 0.12,
                }}
              />
            </div>
          );
        })}
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
  const { beforeMilestones, milestones, afterMilestones } = useMemo(
    () => splitDevNotesMarkdown(devNotesMarkdown),
    []
  );
  const mainNotes = [beforeMilestones, afterMilestones].filter(Boolean).join('\n\n');

  return (
    <AppScreen className="h-full overflow-y-auto overscroll-contain max-w-3xl">
      <AppScreenTitle>Dev notes</AppScreenTitle>
      <div className="px-4 pb-8">
        <DevActivityGrid hours={activityHours} />
        {milestones ? <MarkdownDoc source={milestones} /> : null}
        <MarkdownDoc source={mainNotes} />
      </div>
    </AppScreen>
  );
}
