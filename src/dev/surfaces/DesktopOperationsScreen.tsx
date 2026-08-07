import React, { useMemo, useState } from 'react';
import { Download, LayoutGrid, Plus, UserPlus } from 'lucide-react';
import {
  DesktopButton,
  DesktopCard,
  DesktopDataTable,
  DesktopDragBoard,
  DesktopEmpty,
  DesktopFilterChips,
  DesktopHoverCard,
  DesktopIconButton,
  DesktopInspector,
  DesktopMetric,
  DesktopMetricGrid,
  DesktopPanelGroup,
  DesktopSearchInput,
  DesktopTabs,
  DesktopToolbar,
  DesktopWorkspace,
  type DesktopColumn,
} from '../../surfaces/desktop/kit';
import {
  PREVIEW_SHIFTS,
  SHIFT_STATUS_LABEL,
  SHIFT_STATUS_TONE,
  type PreviewShift,
} from '../surfacePreviewData';

type Tab = 'table' | 'board';
type Scope = 'all' | 'live' | 'open' | 'exceptions';

const BOARD_COLUMNS = [
  { id: 'open', title: 'Unassigned' },
  { id: 'scheduled', title: 'Scheduled' },
  { id: 'live', title: 'Live' },
  { id: 'closed', title: 'Closed', locked: true },
];

/**
 * Staff operations — desktop.
 *
 * A dense sortable table with hover-revealed row actions and checkbox
 * multi-select, a metric strip, resizable panels, a docked inspector, and a
 * drag-and-drop assignment board. Everything the pointer and keyboard can reach
 * is used: sort headers, hover cards, `Enter` to open, `Space` to check,
 * `Cmd/Ctrl+K` for the palette from the shell.
 *
 * This shares no structure with the mobile or tablet screens. There is no split
 * grid, no side panel overlay, no sheet, no tab bar, and the page title lives in
 * the shell's top bar rather than in the page.
 */
export function DesktopOperationsScreen() {
  const [tab, setTab] = useState<Tab>('table');
  const [scope, setScope] = useState<Scope>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(PREVIEW_SHIFTS[0].id);
  const [checked, setChecked] = useState<string[]>([]);
  const [board, setBoard] = useState(PREVIEW_SHIFTS);

  const counts = useMemo(
    () => ({
      all: board.length,
      live: board.filter((shift) => shift.columnId === 'live').length,
      open: board.filter((shift) => shift.status === 'unassigned').length,
      exceptions: board.filter((shift) => shift.status === 'no-show').length,
    }),
    [board],
  );

  const scopes = useMemo(
    () => [
      { value: 'all' as Scope, label: 'All', count: counts.all },
      { value: 'live' as Scope, label: 'Live', count: counts.live },
      { value: 'open' as Scope, label: 'Unassigned', count: counts.open },
      { value: 'exceptions' as Scope, label: 'Exceptions', count: counts.exceptions },
    ],
    [counts],
  );

  const rows = useMemo(() => {
    const scoped = board.filter((shift) => {
      if (scope === 'live') return shift.columnId === 'live';
      if (scope === 'open') return shift.status === 'unassigned';
      if (scope === 'exceptions') return shift.status === 'no-show';
      return true;
    });
    if (query.trim().length === 0) return scoped;
    const needle = query.toLowerCase();
    return scoped.filter(
      (shift) =>
        shift.site.toLowerCase().includes(needle) ||
        shift.guard.toLowerCase().includes(needle) ||
        shift.id.includes(needle),
    );
  }, [board, scope, query]);

  const selected = useMemo(() => board.find((shift) => shift.id === selectedId) ?? null, [board, selectedId]);

  const columns = useMemo<DesktopColumn<PreviewShift>[]>(
    () => [
      { id: 'id', header: 'Job', width: '110px', cell: (row) => <span className="sfp-mono">{row.id}</span>, sortValue: (row) => row.id },
      {
        id: 'site',
        header: 'Site',
        width: '2fr',
        sortValue: (row) => row.site,
        cell: (row) => (
          <DesktopHoverCard
            trigger={<span className="sfp-truncate">{row.site}</span>}
            children={
              <>
                <strong>{row.site}</strong>
                <br />
                {row.city} · gate code 4417
                <br />
                Dispatch (916) 555-0142
              </>
            }
          />
        ),
      },
      { id: 'city', header: 'City', width: '130px', sortValue: (row) => row.city, cell: (row) => row.city, minTableWidth: 1400 },
      {
        id: 'guard',
        header: 'Guard',
        width: '1.2fr',
        sortValue: (row) => row.guard,
        cell: (row) => (
          <>
            <span className="sfp-avatar sfp-avatar--sm">{row.guardInitials}</span>
            <span className="sfp-truncate">{row.guard}</span>
          </>
        ),
      },
      { id: 'window', header: 'Window', width: '1.4fr', sortValue: (row) => row.window, cell: (row) => row.window },
      { id: 'rate', header: 'Rate', width: '96px', align: 'end', sortValue: (row) => Number.parseFloat(row.rate.slice(1)), cell: (row) => row.rate },
      { id: 'payout', header: 'Payout', width: '96px', align: 'end', sortValue: (row) => Number.parseFloat(row.payout.slice(1)), cell: (row) => row.payout },
      {
        id: 'status',
        header: 'Status',
        width: '120px',
        sortValue: (row) => SHIFT_STATUS_LABEL[row.status],
        cell: (row) => (
          <span className="sfp-pill" data-tone={SHIFT_STATUS_TONE[row.status]}>
            {SHIFT_STATUS_LABEL[row.status]}
          </span>
        ),
      },
    ],
    [],
  );

  const table = (
    <DesktopDataTable
      ariaLabel="Shifts"
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      selectedId={selectedId}
      onSelect={(row) => setSelectedId(row.id)}
      selectable
      checkedIds={checked}
      onCheckedChange={setChecked}
      defaultSort={{ columnId: 'window', direction: 'asc' }}
      rowActions={(row) => (
        <>
          <DesktopIconButton icon={UserPlus} label={`Assign guard to ${row.site}`} />
          <DesktopIconButton icon={Download} label={`Export ${row.id}`} />
        </>
      )}
      footer={
        <>
          <span>{rows.length} shifts</span>
          {checked.length > 0 ? <span>{checked.length} selected</span> : null}
          <span>Total {formatTotal(rows)}</span>
        </>
      }
    />
  );

  return (
    <DesktopWorkspace
      toolbar={
        <DesktopToolbar
          search={<DesktopSearchInput value={query} onChange={setQuery} placeholder="Search site, guard, or job id" shortcutHint="/" />}
          filters={<DesktopFilterChips<Scope> options={scopes} value={scope} onChange={setScope} />}
          actions={
            <>
              <DesktopButton variant="ghost" icon={Download}>
                Export
              </DesktopButton>
              <DesktopButton variant="primary" icon={Plus}>
                Create job
              </DesktopButton>
            </>
          }
        />
      }
      tabs={
        <DesktopTabs<Tab>
          tabs={[
            { value: 'table' as Tab, label: 'Table' },
            { value: 'board' as Tab, label: 'Assignment board' },
          ]}
          value={tab}
          onChange={setTab}
        />
      }
    >
      <div className="sfp-desktop-body">
        <DesktopMetricGrid columns={4}>
          <DesktopMetric
            label="Live shifts"
            value={String(counts.live)}
            delta="+1 vs yesterday"
            tone="positive"
            hint="All checked in"
          />
          <DesktopMetric
            label="Unassigned"
            value={String(counts.open)}
            delta="Needs dispatch"
            tone="warning"
            hint="Within 24h"
          />
          <DesktopMetric
            label="Exceptions"
            value={String(counts.exceptions)}
            delta="No-show"
            tone="critical"
            hint="Folsom Tech Campus"
          />
          <DesktopMetric
            label="Payout today"
            value={formatTotal(board)}
            delta="Net of platform fee"
            hint="All open shifts"
          />
        </DesktopMetricGrid>

        {tab === 'table' ? (
          <div className="sfp-desktop-panels">
            <DesktopPanelGroup
              storageKey="preview-ops"
              initialPrimaryWidth={860}
              minPrimaryWidth={520}
              maxPrimaryWidth={1400}
              primary={table}
              secondary={
                selected ? (
                  <DesktopInspector
                    title={selected.site}
                    subtitle={`${selected.city} · Job ${selected.id}`}
                    onClose={() => setSelectedId(null)}
                    actions={<DesktopButton size="small" variant="secondary">Reassign</DesktopButton>}
                  >
                    <div className="sfp-inspector-stack">
                          <DesktopCard title="Shift">
                            <dl className="sfp-kv">
                              <div>
                                <dt>Guard</dt>
                                <dd>{selected.guard}</dd>
                              </div>
                              <div>
                                <dt>Window</dt>
                                <dd>{selected.window}</dd>
                              </div>
                              <div>
                                <dt>Rate</dt>
                                <dd>{selected.rate}</dd>
                              </div>
                              <div>
                                <dt>Payout</dt>
                                <dd>{selected.payout}</dd>
                              </div>
                              <div>
                                <dt>Post type</dt>
                                <dd>{selected.armed ? 'Armed' : 'Unarmed'}</dd>
                              </div>
                            </dl>
                          </DesktopCard>
                          <DesktopCard title="Activity">
                            <ul className="sfp-timeline">
                              <li>
                                <span>08:02</span> Clocked in on site
                              </li>
                              <li>
                                <span>09:14</span> Perimeter walk logged
                              </li>
                              <li>
                                <span>11:40</span> Mid-shift check-in acknowledged
                              </li>
                            </ul>
                          </DesktopCard>
                    </div>
                  </DesktopInspector>
                ) : null
              }
            />
          </div>
        ) : (
          <DesktopCard title="Assignment board" padded={false}>
            <div className="sfp-board-wrap">
              <DesktopDragBoard
                ariaLabel="Shift assignment board"
                columns={BOARD_COLUMNS.map((column) => ({
                  ...column,
                  items: board.filter((shift) => shift.columnId === column.id),
                  emptyMessage: 'Drag a shift here',
                }))}
                renderItem={(shift) => (
                  <>
                    <p className="sfp-board-title">{shift.site}</p>
                    <p className="sfp-board-meta">
                      {shift.guard} · {shift.rate}
                    </p>
                  </>
                )}
                onMove={(itemId, toColumnId) =>
                  setBoard((current) =>
                    current.map((shift) => (shift.id === itemId ? { ...shift, columnId: toColumnId } : shift)),
                  )
                }
              />
            </div>
          </DesktopCard>
        )}

        {rows.length === 0 ? (
          <DesktopEmpty
            title="No shifts match this view"
            message="Clear the search or pick a different scope. Press Cmd/Ctrl+K to jump to another section."
            action={
              <DesktopButton variant="secondary" icon={LayoutGrid} onClick={() => { setScope('all'); setQuery(''); }}>
                Reset filters
              </DesktopButton>
            }
          />
        ) : null}
      </div>
    </DesktopWorkspace>
  );
}

function formatTotal(rows: PreviewShift[]): string {
  const total = rows.reduce((sum, row) => sum + Number.parseFloat(row.payout.slice(1).replace(',', '')), 0);
  return `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
