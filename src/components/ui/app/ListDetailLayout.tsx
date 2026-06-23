import React from 'react';
import { AppItemCardStack } from './AppPrimitives';

export interface ListDetailRenderOptions {
  onBack?: () => void;
}

export interface ListDetailLayoutProps<T> {
  items: T[];
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
  getItemId: (item: T) => string;
  renderItem: (item: T, onSelect: () => void) => React.ReactNode;
  renderDetail: (item: T, options: ListDetailRenderOptions) => React.ReactNode;
  emptyDetail?: React.ReactNode;
  listScrollClassName?: string;
}

/** True when a list item is selected and the list should be hidden. */
export function useListDetailState(selectedId: string | null) {
  return { showDetailOnly: Boolean(selectedId) };
}

export function ListDetailLayout<T>({
  items,
  selectedId,
  onSelectId,
  getItemId,
  renderItem,
  renderDetail,
  emptyDetail,
  listScrollClassName,
}: ListDetailLayoutProps<T>) {
  const selected = selectedId ? items.find((item) => getItemId(item) === selectedId) ?? null : null;

  if (selected) {
    return renderDetail(selected, { onBack: () => onSelectId(null) });
  }

  if (items.length === 0 && emptyDetail) {
    return emptyDetail;
  }

  const list = (
    <AppItemCardStack>
      {items.map((item) => {
        const id = getItemId(item);
        return (
          <React.Fragment key={id}>
            {renderItem(item, () => onSelectId(id))}
          </React.Fragment>
        );
      })}
    </AppItemCardStack>
  );

  if (listScrollClassName) {
    return <div className={listScrollClassName}>{list}</div>;
  }

  return list;
}
