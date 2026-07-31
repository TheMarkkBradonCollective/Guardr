import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { useDevice } from '../../lib/platform';

/** Below this container width a table stops being readable and becomes cards. */
const CARD_BREAKPOINT_PX = 720;

function useContainerWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number | null] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    setWidth(node.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

export interface UberTableColumn<T> {
  id: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  /** Tabular figures + numeric alignment (Uber aligns amounts and IDs). */
  numeric?: boolean;
  align?: 'left' | 'right';
  /** Column takes the remaining width. */
  grow?: boolean;
  width?: string;
  /** Enables header sorting; return a comparable value. */
  sortValue?: (row: T) => string | number;
  /** Hidden below the narrow-table breakpoint. */
  hideOnNarrow?: boolean;
}

export interface UberDataTableProps<T> {
  columns: UberTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedKey?: string;
  caption?: string;
  emptyMessage?: string;
  /** Row density — Uber uses compact for dense ops tables. */
  density?: 'compact' | 'default';
  className?: string;
  /**
   * Phone layout. Uber never scrolls a table sideways on a phone — rows become
   * stacked cards. Column ids map onto the card slots; omitted ids fall back to
   * first column as the title, last as the trailing state.
   */
  cardLayout?: {
    title?: string;
    subtitle?: string;
    trailing?: string;
    meta?: string[];
  };
  /** Force the table (or card) layout regardless of form factor. */
  layout?: 'auto' | 'table' | 'cards';
}

type SortState = { columnId: string; direction: 'asc' | 'desc' } | null;

/**
 * Uber operations table — the dense list pattern from Uber Freight's
 * financials and load boards: quiet header row, hairline row rules, tabular
 * figures, right-aligned amounts, whole-row hover and keyboard activation.
 */
export function UberDataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  selectedKey,
  caption,
  emptyMessage = 'Nothing to show yet.',
  density = 'default',
  className = '',
  cardLayout,
  layout = 'auto',
}: UberDataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null);
  const { formFactor } = useDevice();
  const [measureRef, containerWidth] = useContainerWidth<HTMLElement>();
  // Cards win whenever the table would have to scroll sideways — phones
  // always, and any narrow container (tablet portrait, split panes).
  const tooNarrowForTable =
    containerWidth != null && containerWidth < Math.min(CARD_BREAKPOINT_PX, columns.length * 130);
  const useCards =
    layout === 'cards' ||
    (layout === 'auto' && (formFactor === 'mobile' || tooNarrowForTable));

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.id === sort.columnId);
    if (!column?.sortValue) return rows;
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * factor;
    });
  }, [rows, columns, sort]);

  const toggleSort = (columnId: string) => {
    setSort((current) => {
      if (current?.columnId !== columnId) return { columnId, direction: 'asc' };
      if (current.direction === 'asc') return { columnId, direction: 'desc' };
      return null;
    });
  };

  if (useCards) {
    const byId = (id?: string) => (id ? columns.find((c) => c.id === id) : undefined);
    const titleColumn =
      byId(cardLayout?.title) ?? columns.find((c) => c.grow) ?? columns[0];
    const subtitleColumn = byId(cardLayout?.subtitle);
    const trailingColumn =
      byId(cardLayout?.trailing) ?? (columns.length > 1 ? columns[columns.length - 1] : undefined);
    const metaColumns = cardLayout?.meta
      ? cardLayout.meta.map((id) => byId(id)).filter(Boolean as unknown as (c?: UberTableColumn<T>) => c is UberTableColumn<T>)
      : columns.filter(
          (c) => c !== titleColumn && c !== subtitleColumn && c !== trailingColumn,
        );

    return (
      <ul ref={measureRef as React.RefObject<HTMLUListElement | null>} className={`uber-record-list ${className}`.trim()} aria-label={caption}>
        {sortedRows.length === 0 ? (
          <li className="uber-record-empty">{emptyMessage}</li>
        ) : (
          sortedRows.map((row) => {
            const key = rowKey(row);
            const interactive = !!onRowClick;
            const Wrapper = interactive ? 'button' : 'div';
            return (
              <li key={key} className="uber-record">
                <Wrapper
                  {...(interactive
                    ? { type: 'button' as const, onClick: () => onRowClick(row) }
                    : {})}
                  className="uber-record-inner"
                  data-selected={selectedKey === key ? 'true' : undefined}
                >
                  <div className="uber-record-main">
                    <p className="uber-record-title">{titleColumn?.render(row)}</p>
                    {subtitleColumn ? (
                      <p className="uber-record-subtitle">{subtitleColumn.render(row)}</p>
                    ) : null}
                    {metaColumns.length > 0 ? (
                      <dl className="uber-record-meta">
                        {metaColumns.map((column) => (
                          <div key={column.id} className="uber-record-meta-item">
                            <dt>{column.header}</dt>
                            <dd data-numeric={column.numeric ? 'true' : undefined}>
                              {column.render(row)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </div>
                  <div className="uber-record-trailing">
                    {trailingColumn ? trailingColumn.render(row) : null}
                    {interactive ? (
                      <ChevronRight size={18} aria-hidden className="uber-record-chevron" />
                    ) : null}
                  </div>
                </Wrapper>
              </li>
            );
          })
        )}
      </ul>
    );
  }

  return (
    <div ref={measureRef as React.RefObject<HTMLDivElement | null>} className={`uber-table-wrap ${className}`.trim()}>
      <table className={`uber-table${density === 'compact' ? ' uber-table--compact' : ''}`}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => {
              const sortable = !!column.sortValue;
              const active = sort?.columnId === column.id;
              return (
                <th
                  key={column.id}
                  scope="col"
                  style={{ width: column.width, ...(column.grow ? { width: 'auto' } : {}) }}
                  data-align={column.align ?? (column.numeric ? 'left' : undefined)}
                  data-narrow-hidden={column.hideOnNarrow ? 'true' : undefined}
                  aria-sort={active ? (sort!.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {sortable ? (
                    <button type="button" className="uber-table-sort" onClick={() => toggleSort(column.id)}>
                      {column.header}
                      {active ? (
                        sort!.direction === 'asc' ? (
                          <ChevronUp size={14} aria-hidden />
                        ) : (
                          <ChevronDown size={14} aria-hidden />
                        )
                      ) : null}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.length === 0 ? (
            <tr className="uber-table-empty-row">
              <td colSpan={columns.length}>{emptyMessage}</td>
            </tr>
          ) : (
            sortedRows.map((row) => {
              const key = rowKey(row);
              const interactive = !!onRowClick;
              return (
                <tr
                  key={key}
                  data-interactive={interactive ? 'true' : undefined}
                  data-selected={selectedKey === key ? 'true' : undefined}
                  tabIndex={interactive ? 0 : undefined}
                  role={interactive ? 'button' : undefined}
                  onClick={interactive ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    interactive
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      data-align={column.align ?? (column.numeric ? 'left' : undefined)}
                      data-numeric={column.numeric ? 'true' : undefined}
                      data-narrow-hidden={column.hideOnNarrow ? 'true' : undefined}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
