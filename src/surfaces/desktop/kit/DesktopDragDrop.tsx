import React, { useCallback, useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';

/**
 * Drag-and-drop board for desktop assignment work — dragging a guard onto a
 * shift, moving a job between queues, reordering a priority list.
 *
 * Built on the HTML drag-and-drop API so it also accepts drops from outside the
 * board, and every drag has a keyboard equivalent (`Space` to lift, arrows to
 * move, `Space` to drop) because a pointer-only reorder is not accessible.
 *
 * Desktop only. The touch surfaces expose the same operations as explicit
 * actions: a long-press drag competes with scrolling and hides the target.
 */

export interface DragItem {
  id: string;
  /** Column this item currently belongs to. */
  columnId: string;
}

export interface DesktopDragBoardColumn<Item extends DragItem> {
  id: string;
  title: string;
  items: Item[];
  /** Blocks drops, e.g. a queue the current user cannot write to. */
  locked?: boolean;
  /** Count badge override; defaults to `items.length`. */
  count?: number;
  emptyMessage?: string;
}

export interface DesktopDragBoardProps<Item extends DragItem> {
  columns: DesktopDragBoardColumn<Item>[];
  renderItem: (item: Item) => React.ReactNode;
  /** Called when an item is dropped into a different column or position. */
  onMove: (itemId: string, toColumnId: string, toIndex: number) => void;
  ariaLabel: string;
}

interface LiftState {
  itemId: string;
  fromColumnId: string;
  columnIndex: number;
  itemIndex: number;
}

export function DesktopDragBoard<Item extends DragItem>({
  columns,
  renderItem,
  onMove,
  ariaLabel,
}: DesktopDragBoardProps<Item>) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<{ columnId: string; index: number } | null>(null);
  const [lift, setLift] = useState<LiftState | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const commit = useCallback(
    (itemId: string, columnId: string, index: number) => {
      onMove(itemId, columnId, index);
      setDragId(null);
      setOver(null);
    },
    [onMove],
  );

  const onItemKeyDown = (event: React.KeyboardEvent, item: Item, columnIndex: number, itemIndex: number) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (lift?.itemId === item.id) {
        commit(lift.itemId, columns[lift.columnIndex].id, lift.itemIndex);
        setLift(null);
      } else {
        setLift({ itemId: item.id, fromColumnId: item.columnId, columnIndex, itemIndex });
      }
      return;
    }

    if (event.key === 'Escape' && lift) {
      event.preventDefault();
      setLift(null);
      return;
    }

    if (!lift || lift.itemId !== item.id) return;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const nextColumn = Math.max(0, Math.min(columns.length - 1, lift.columnIndex + delta));
      if (columns[nextColumn].locked) return;
      setLift({ ...lift, columnIndex: nextColumn, itemIndex: 0 });
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const target = columns[lift.columnIndex];
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      setLift({
        ...lift,
        itemIndex: Math.max(0, Math.min(target.items.length, lift.itemIndex + delta)),
      });
    }
  };

  return (
    <div className="sfd-board" ref={boardRef} role="group" aria-label={ariaLabel}>
      {columns.map((column, columnIndex) => {
        const liftingHere = lift?.columnIndex === columnIndex;
        return (
          <section
            key={column.id}
            className="sfd-board-column"
            data-locked={column.locked ? 'true' : undefined}
            data-over={over?.columnId === column.id ? 'true' : undefined}
            onDragOver={(event) => {
              if (column.locked || !dragId) return;
              event.preventDefault();
              setOver({ columnId: column.id, index: column.items.length });
            }}
            onDragLeave={() => setOver((value) => (value?.columnId === column.id ? null : value))}
            onDrop={(event) => {
              if (column.locked || !dragId) return;
              event.preventDefault();
              commit(dragId, column.id, over?.index ?? column.items.length);
            }}
          >
            <header className="sfd-board-column-head">
              <h3 className="sfd-board-column-title">{column.title}</h3>
              <span className="sfd-board-column-count">{column.count ?? column.items.length}</span>
            </header>

            <div className="sfd-board-column-body">
              {column.items.length === 0 ? (
                <p className="sfd-board-empty">{column.emptyMessage ?? 'Drop items here'}</p>
              ) : null}

              {column.items.map((item, itemIndex) => (
                <React.Fragment key={item.id}>
                  {liftingHere && lift.itemIndex === itemIndex ? (
                    <span className="sfd-board-drop-line" aria-hidden />
                  ) : null}
                  <div
                    className="sfd-board-card"
                    draggable
                    tabIndex={0}
                    role="button"
                    aria-grabbed={lift?.itemId === item.id || dragId === item.id}
                    data-dragging={dragId === item.id ? 'true' : undefined}
                    data-lifted={lift?.itemId === item.id ? 'true' : undefined}
                    onDragStart={(event) => {
                      setDragId(item.id);
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', item.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOver(null);
                    }}
                    onDragOver={(event) => {
                      if (column.locked || !dragId || dragId === item.id) return;
                      event.preventDefault();
                      event.stopPropagation();
                      // Drop above or below depending on which half the pointer is over.
                      const rect = event.currentTarget.getBoundingClientRect();
                      const after = event.clientY > rect.top + rect.height / 2;
                      setOver({ columnId: column.id, index: itemIndex + (after ? 1 : 0) });
                    }}
                    onKeyDown={(event) => onItemKeyDown(event, item, columnIndex, itemIndex)}
                  >
                    <GripVertical size={14} strokeWidth={2} aria-hidden className="sfd-board-grip" />
                    <div className="sfd-board-card-body">{renderItem(item)}</div>
                  </div>
                </React.Fragment>
              ))}

              {liftingHere && lift.itemIndex >= column.items.length ? (
                <span className="sfd-board-drop-line" aria-hidden />
              ) : null}
              {over?.columnId === column.id && over.index >= column.items.length && dragId ? (
                <span className="sfd-board-drop-line" aria-hidden />
              ) : null}
            </div>
          </section>
        );
      })}

      <p className="sfd-board-hint" aria-live="polite">
        {lift
          ? `Moving item. Arrow keys to reposition, Space to drop, Escape to cancel.`
          : 'Drag a card, or focus one and press Space to move it with the keyboard.'}
      </p>
    </div>
  );
}

/**
 * Reorderable single-column list. Same keyboard contract as the board, used for
 * priority ordering where there is only one queue.
 */
export function DesktopReorderList<Item extends { id: string }>({
  items,
  renderItem,
  onReorder,
  ariaLabel,
}: {
  items: Item[];
  renderItem: (item: Item) => React.ReactNode;
  onReorder: (fromIndex: number, toIndex: number) => void;
  ariaLabel: string;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  return (
    <ul className="sfd-reorder" aria-label={ariaLabel}>
      {items.map((item, index) => (
        <li
          key={item.id}
          className="sfd-reorder-item"
          draggable
          tabIndex={0}
          data-dragging={dragIndex === index ? 'true' : undefined}
          data-over={overIndex === index ? 'true' : undefined}
          onDragStart={() => setDragIndex(index)}
          onDragOver={(event) => {
            event.preventDefault();
            setOverIndex(index);
          }}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (dragIndex != null && dragIndex !== index) onReorder(dragIndex, index);
            setDragIndex(null);
            setOverIndex(null);
          }}
          onKeyDown={(event) => {
            if (!event.altKey) return;
            if (event.key === 'ArrowUp' && index > 0) {
              event.preventDefault();
              onReorder(index, index - 1);
            } else if (event.key === 'ArrowDown' && index < items.length - 1) {
              event.preventDefault();
              onReorder(index, index + 1);
            }
          }}
        >
          <GripVertical size={14} strokeWidth={2} aria-hidden className="sfd-reorder-grip" />
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}
