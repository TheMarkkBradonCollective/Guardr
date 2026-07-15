import React from 'react';
import { BREAKPOINTS, useMediaQuery } from '../../../lib/platform';
import { AppItemCardStack } from './AppPrimitives';

export type ListDetailMobilePresentation = 'inline' | 'page';

export interface ListDetailRenderOptions {
  onBack?: () => void;
}

export interface ListDetailLayoutProps<T> {
  items: T[];
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
  getItemId: (item: T) => string;
  renderItem: (item: T, isSelected: boolean, onSelect: () => void) => React.ReactNode;
  renderDetail: (item: T, options?: ListDetailRenderOptions) => React.ReactNode;
  autoSelectFirst?: boolean;
  emptyDetail?: React.ReactNode;
  listScrollClassName?: string;
  detailClassName?: string;
  mobilePresentation?: ListDetailMobilePresentation;
}

export function useSplitListDetail(
  selectedId: string | null,
  mobilePresentation: ListDetailMobilePresentation = 'inline'
) {
  const splitView = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
  const showDetailOnly = mobilePresentation === 'page' && Boolean(selectedId && !splitView);

  return { splitView, showDetailOnly };
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
  mobilePresentation = 'inline',
}: ListDetailLayoutProps<T>) {
  const { splitView, showDetailOnly } = useSplitListDetail(selectedId, mobilePresentation);

  const resolvedSelectedId =
    selectedId ??
    (splitView && autoSelectFirst && items.length > 0 ? getItemId(items[0]) : null);

  const selected = items.find((item) => getItemId(item) === resolvedSelectedId) ?? null;

  const handleSelect = (id: string) => {
    if (mobilePresentation === 'inline' && !splitView && id === selectedId) {
      onSelectId(null);
      return;
    }
    onSelectId(id);
  };

  if (splitView) {
    return (
      <div className="tablet-split-panel">
        <div className={`split-list-pane ${listScrollClassName}`}>
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
        <div className={`split-detail-pane min-h-0 ${detailClassName}`}>
          {selected ? renderDetail(selected) : emptyDetail}
        </div>
      </div>
    );
  }

  if (showDetailOnly && selected) {
    return renderDetail(selected, { onBack: () => onSelectId(null) });
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
