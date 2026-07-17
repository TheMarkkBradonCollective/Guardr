import React, { useMemo } from 'react';
import devNotesMarkdown from '../../../docs/DEV-UPDATES.md?raw';
import { parseDevActivityGrid } from '../../lib/devActivityGrid';
import { MarkdownDoc } from './MarkdownDoc';
import { AppScreen, AppScreenTitle } from '../ui/app/AppPrimitives';
import { StaffOpsPageShell } from '../staff/StaffOpsPageShell';
import { WorkbenchSplit } from '../baseui/layout/WorkbenchLayout';
import { useDevice } from '../../lib/platform';

const SUMMARY_HEADING = '## Quick reference by date';

function splitDevNotesMarkdown(markdown: string) {
  const start = markdown.indexOf(SUMMARY_HEADING);
  if (start < 0) {
    return { beforeSummary: markdown, summary: '', afterSummary: '' };
  }

  const sectionEnd = markdown.indexOf('\n---\n', start + SUMMARY_HEADING.length);
  const summaryEnd = sectionEnd >= 0 ? sectionEnd : markdown.length;

  return {
    beforeSummary: markdown.slice(0, start).trimEnd(),
    summary: markdown.slice(start, summaryEnd).trimEnd(),
    afterSummary: (sectionEnd >= 0 ? markdown.slice(sectionEnd) : '').trimStart(),
  };
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_LABELS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

function DevActivityGrid({ grid, variant = 'mobile' }: { grid: number[][]; variant?: 'mobile' | 'desktop' }) {
  const max = Math.max(1, ...grid.flat());
  const isDesktop = variant === 'desktop';

  return (
    <div
      className={
        isDesktop
          ? 'adm-dev-notes-activity'
          : 'mb-8 rounded-xl border border-brand-border bg-brand-surface-elevated p-4'
      }
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted mb-1">
        Dev activity by day & hour
      </p>
      <p className="text-xs text-brand-text-muted mb-4 leading-relaxed">
        When commits land across the week — similar to rush-hour charts. Rows are days; columns are hours.
        Peaks show when Cursor and Markeith White are most active.
      </p>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between py-0.5 shrink-0">
          {DAY_LABELS.map((label) => (
            <span key={label} className="text-[10px] text-brand-text-muted leading-none h-3 flex items-center">
              {label}
            </span>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-0.5">
            {grid.map((dayHours, day) => (
              <div key={day} className="flex gap-px h-3">
                {dayHours.map((count, hour) => {
                  const intensity = count > 0 ? 0.25 + 0.75 * (count / max) : 0.08;
                  return (
                    <div
                      key={hour}
                      className="flex-1 min-w-0 rounded-[2px] bg-brand-primary transition-colors"
                      style={{ opacity: intensity }}
                      title={`${DAY_LABELS[day]} ${formatHourLabel(hour)} — ${count} commit${count === 1 ? '' : 's'}`}
                      aria-label={`${DAY_LABELS[day]} ${formatHourLabel(hour)}, ${count} commits`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-brand-text-muted">
            {HOUR_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DevNotesPage() {
  const { formFactor } = useDevice();
  const isDesktop = formFactor === 'desktop';
  const activityGrid = useMemo(() => parseDevActivityGrid(devNotesMarkdown), []);
  const { beforeSummary, summary, afterSummary } = useMemo(
    () => splitDevNotesMarkdown(devNotesMarkdown),
    []
  );
  const mainNotes = [beforeSummary, afterSummary].filter(Boolean).join('\n\n');

  const mobileContent = (
    <>
      <AppScreenTitle>Dev notes</AppScreenTitle>
      <div className="px-4 pb-8">
        <DevActivityGrid grid={activityGrid} />
        {summary ? <MarkdownDoc source={summary} /> : null}
        <MarkdownDoc source={mainNotes} />
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <StaffOpsPageShell
        className="adm-platform-page adm-dev-notes-page"
        toolbar={
          <div>
            <p className="adm-card-eyebrow">Platform</p>
            <p className="uber-workbench-subtitle">
              Build history, commit activity heatmap, and release notes.
            </p>
          </div>
        }
      >
        <WorkbenchSplit
          className="adm-dev-notes-workbench"
          list={
            <div className="adm-dev-notes-sidebar">
              <DevActivityGrid grid={activityGrid} variant="desktop" />
              {summary ? (
                <section className="adm-dev-notes-summary">
                  <MarkdownDoc source={summary} />
                </section>
              ) : null}
            </div>
          }
          detail={<MarkdownDoc source={mainNotes} />}
        />
      </StaffOpsPageShell>
    );
  }

  return (
    <AppScreen className="h-full overflow-y-auto overscroll-contain max-w-3xl">
      {mobileContent}
    </AppScreen>
  );
}
