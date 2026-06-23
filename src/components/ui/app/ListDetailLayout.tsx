import React from 'react';
import { useDevice } from '../../../lib/platform';
import { AppItemCardStack } from './AppPrimitives';

export interface ListDetailLayoutProps<T> {
  items: T[];
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
  getItemId: (item: T) => string;
  renderItem: (item: T, isSelected: boolean, onSelect: () => void) => React.ReactNode;
  renderDetail: (item: T) => React.ReactNode;
  autoSelectFirst?: boolean;
  emptyDetail?: React.ReactNode;
  listScrollClassName?: string;
  detailClassName?: string;
}

export function ListDetailLayout<T>({
  items,
  selectedId,
  onSelectId,
  getItemId,
  renderItem,
  renderDetail,
  autoSelectFirst = true,
  emptyDetail,
  listScrollClassName = 'max-h-[70vh] overflow-y-auto pr-1',
  detailClassName = 'staff-detail-pane space-y-4',
}: ListDetailLayoutProps<T>) {
  const { formFactor } = useDevice();
  const splitView = formFactor === 'tablet' || formFactor === 'desktop';

  const resolvedSelectedId =
    selectedId ??
    (splitView && autoSelectFirst && items.length > 0 ? getItemId(items[0]) : null);

  const selected = items.find((item) => getItemId(item) === resolvedSelectedId) ?? null;

  const handleSelect = (id: string) => {
    if (!splitView && id === selectedId) {
      onSelectId(null);
      return;
    }
    onSelectId(id);
  };

  if (splitView) {
    return (
      <div className="tablet-split-panel">
        <div className={listScrollClassName}>
          <AppItemCardStack>
            {items.map((item) => {
              const id = getItemId(item);
              const isSelected = resolvedSelectedId === id;
              return (
                <React.Fragment key={id}>
                  {renderItem(item, isSelected, () => handleSelect(id))}
                </React.Fragment>
              );
            })}
          </AppItemCardStack>
        </div>
        <div className="min-h-0">
          {selected ? renderDetail(selected) : emptyDetail}
        </div>
      </div>
    );
  }

  return (
    <AppItemCardStack>
      {items.map((item) => {
        const id = getItemId(item);
        const isSelected = selectedId === id;
        return (
          <div key={id} className={isSelected ? 'space-y-4' : undefined}>
            {renderItem(item, isSelected, () => handleSelect(id))}
            {isSelected && <div className={detailClassName}>{renderDetail(item)}</div>}
          </div>
        );
      })}
    </AppItemCardStack>
  );
}
