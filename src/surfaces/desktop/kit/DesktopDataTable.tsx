import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

export interface DesktopColumn<Row> {
  id: string;
  header: string;
  /** Cell renderer. Keep it cheap — this runs per visible row. */
  cell: (row: Row) => React.ReactNode;
  /** Sort key. Omit to make the column unsortable. */
  sortValue?: (row: Row) => string | number;
  /** Fixed or fractional width, e.g. `"160px"` or `"1.5fr"`. */
  width?: string;
  align?: 'start' | 'end';
  /** Hides the column below this container width, in px. */
  minTableWidth?: number;
}

export type SortDirection = 'asc' | 'desc';

export interface DesktopDataTableProps<Row> {
  rows: Row[];
  columns: DesktopColumn<Row>[];
  rowKey: (row: Row) => string;
  /** Selected row id — the table is a controlled list/detail driver. */
  selectedId?: string | null;
  onSelect?: (row: Row) => void;
  /** Enables checkbox multi-select and reports the selection. */
  selectable?: boolean;
  checkedIds?: string[];
  onCheckedChange?: (ids: string[]) => void;
  /** Row-level actions revealed on hover. */
  rowActions?: (row: Row) => React.ReactNode;
  emptyMessage?: string;
  loading?: boolean;
  /** Initial sort. Sorting is otherwise internal to the table. */
  defaultSort?: { columnId: string; direction: SortDirection };
  /** Sticky footer summary, e.g. totals. */
  footer?: React.ReactNode;
  density?: 'compact' | 'default';
  ariaLabel: string;
}

/**
 * The desktop operations table.
 *
 * Sortable headers, hover-revealed row actions, checkbox multi-select, and full
 * keyboard traversal: Up/Down moves the cursor, Enter opens, Space toggles the
 * checkbox. This is the desktop surface's primary way of showing a collection —
 * mobile shows the same data as tap rows and tablet as a master list, because
 * neither can present twelve columns or hover affordances.
 */
export function DesktopDataTable<Row>({
  rows,
  columns,
  rowKey,
  selectedId,
  onSelect,
  selectable = false,
  checkedIds = [],
  onCheckedChange,
  rowActions,
  emptyMessage = 'No records',
  loading = false,
  defaultSort,
  footer,
  density = 'default',
  ariaLabel,
}: DesktopDataTableProps<Row>) {
  const [sort, setSort] = useState<{ columnId: string; direction: SortDirection } | null>(
    defaultSort ?? null,
  );
  const [cursor, setCursor] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((item) => item.id === sort.columnId);
    if (!column?.sortValue) return rows;
    const factor = sort.direction === 'asc' ? 1 : -1;
    // Copy first: sorting the caller's array in place would mutate app state.
    return [...rows].sort((a, b) => {
      const left = column.sortValue!(a);
      const right = column.sortValue!(b);
      if (typeof left === 'number' && typeof right === 'number') return (left - right) * factor;
      return String(left).localeCompare(String(right)) * factor;
    });
  }, [rows, columns, sort]);

  const checked = useMemo(() => new Set(checkedIds), [checkedIds]);
  const allChecked = sortedRows.length > 0 && sortedRows.every((row) => checked.has(rowKey(row)));

  const gridTemplate = useMemo(() => {
    const parts = columns.map((column) => column.width ?? '1fr');
    if (selectable) parts.unshift('36px');
    if (rowActions) parts.push('auto');
    return parts.join(' ');
  }, [columns, selectable, rowActions]);

  const toggleSort = (column: DesktopColumn<Row>) => {
    if (!column.sortValue) return;
    setSort((current) => {
      if (current?.columnId !== column.id) return { columnId: column.id, direction: 'asc' };
      if (current.direction === 'asc') return { columnId: column.id, direction: 'desc' };
      return null;
    });
  };

  const toggleChecked = useCallback(
    (id: string) => {
      if (!onCheckedChange) return;
      const next = new Set(checked);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onCheckedChange([...next]);
    },
    [checked, onCheckedChange],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (sortedRows.length === 0) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      setCursor((value) => Math.max(0, Math.min(sortedRows.length - 1, value + delta)));
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setCursor(event.key === 'Home' ? 0 : sortedRows.length - 1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const row = sortedRows[cursor];
      if (row) onSelect?.(row);
      return;
    }
    if (event.key === ' ' && selectable) {
      event.preventDefault();
      const row = sortedRows[cursor];
      if (row) toggleChecked(rowKey(row));
    }
  };

  useEffect(() => {
    const node = bodyRef.current?.querySelector('[data-cursor="true"]');
    node?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  // Keep the cursor in range when the row set shrinks under a filter.
  useEffect(() => {
    setCursor((value) => Math.min(value, Math.max(0, sortedRows.length - 1)));
  }, [sortedRows.length]);

  return (
    <div className="sfd-table" data-density={density} role="grid" aria-label={ariaLabel}>
      <div className="sfd-table-head" style={{ gridTemplateColumns: gridTemplate }} role="row">
        {selectable ? (
          <span className="sfd-table-cell sfd-table-cell--check">
            <input
              type="checkbox"
              checked={allChecked}
              aria-label={allChecked ? 'Clear selection' : 'Select all rows'}
              onChange={() =>
                onCheckedChange?.(allChecked ? [] : sortedRows.map((row) => rowKey(row)))
              }
            />
          </span>
        ) : null}

        {columns.map((column) => {
          const active = sort?.columnId === column.id;
          const sortable = Boolean(column.sortValue);
          return (
            <span
              key={column.id}
              className="sfd-table-cell sfd-table-cell--head"
              data-align={column.align ?? 'start'}
              data-sortable={sortable ? 'true' : undefined}
              data-min-width={column.minTableWidth}
              role="columnheader"
              aria-sort={active ? (sort!.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              {sortable ? (
                <button type="button" className="sfd-table-sort" onClick={() => toggleSort(column)}>
                  <span>{column.header}</span>
                  {active ? (
                    sort!.direction === 'asc' ? (
                      <ArrowUp size={12} strokeWidth={2.5} aria-hidden />
                    ) : (
                      <ArrowDown size={12} strokeWidth={2.5} aria-hidden />
                    )
                  ) : (
                    <ChevronsUpDown size={12} strokeWidth={2} aria-hidden className="sfd-table-sort-idle" />
                  )}
                </button>
              ) : (
                column.header
              )}
            </span>
          );
        })}

        {rowActions ? <span className="sfd-table-cell sfd-table-cell--actions" aria-hidden /> : null}
      </div>

      <div
        className="sfd-table-body"
        ref={bodyRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-rowcount={sortedRows.length}
      >
        {loading ? (
          <DesktopTableSkeleton columns={columns.length + (selectable ? 1 : 0)} rows={10} template={gridTemplate} />
        ) : sortedRows.length === 0 ? (
          <p className="sfd-table-empty">{emptyMessage}</p>
        ) : (
          sortedRows.map((row, index) => {
            const id = rowKey(row);
            return (
              <div
                key={id}
                role="row"
                className="sfd-table-row"
                style={{ gridTemplateColumns: gridTemplate }}
                data-selected={id === selectedId ? 'true' : undefined}
                data-cursor={index === cursor ? 'true' : undefined}
                data-checked={checked.has(id) ? 'true' : undefined}
                onClick={() => {
                  setCursor(index);
                  onSelect?.(row);
                }}
                onDoubleClick={() => onSelect?.(row)}
              >
                {selectable ? (
                  <span className="sfd-table-cell sfd-table-cell--check">
                    <input
                      type="checkbox"
                      checked={checked.has(id)}
                      aria-label={`Select row ${index + 1}`}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => toggleChecked(id)}
                    />
                  </span>
                ) : null}

                {columns.map((column) => (
                  <span
                    key={column.id}
                    className="sfd-table-cell"
                    data-align={column.align ?? 'start'}
                    data-min-width={column.minTableWidth}
                    role="gridcell"
                  >
                    {column.cell(row)}
                  </span>
                ))}

                {rowActions ? (
                  <span
                    className="sfd-table-cell sfd-table-cell--actions"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {rowActions(row)}
                  </span>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {footer ? <div className="sfd-table-foot">{footer}</div> : null}
    </div>
  );
}

function DesktopTableSkeleton({
  columns,
  rows,
  template,
}: {
  columns: number;
  rows: number;
  template: string;
}) {
  return (
    <div role="status" aria-label="Loading rows">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div className="sfd-table-row sfd-table-row--skeleton" key={rowIndex} style={{ gridTemplateColumns: template }}>
          {Array.from({ length: columns }, (_, cellIndex) => (
            <span className="sfd-table-cell" key={cellIndex}>
              <span
                className="sfd-skel"
                style={{ width: `${45 + ((rowIndex + cellIndex) % 5) * 10}%`, height: 12 }}
              />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
