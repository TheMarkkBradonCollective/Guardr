import React from 'react';
import { AppItemCardStack } from './AppPrimitives';
import { WorkbenchEmpty } from '../../baseui/layout/WorkbenchLayout';
import { useSurfaceKind } from '../../../surfaces';
import { DesktopPanelGroup } from '../../../surfaces/desktop/kit/DesktopPanels';

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
  const surface = useSurfaceKind();
  const desktopView = surface === 'desktop';
  const splitView = surface === 'tablet';
  const showDetailOnly =
    mobilePresentation === 'page' && Boolean(selectedId && surface === 'mobile');

  return { splitView, desktopView, showDetailOnly };
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
  const { splitView, desktopView, showDetailOnly } = useSplitListDetail(selectedId, mobilePresentation);

  const resolvedSelectedId =
    selectedId ??
    ((splitView || desktopView) && autoSelectFirst && items.length > 0 ? getItemId(items[0]) : null);

  const selected = items.find((item) => getItemId(item) === resolvedSelectedId) ?? null;

  const handleSelect = (id: string) => {
    if (mobilePresentation === 'inline' && !splitView && !desktopView && id === selectedId) {
      onSelectId(null);
      return;
    }
    onSelectId(id);
  };

  const list = (
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
  );

  if (desktopView) {
    return (
      <div className="h-full min-h-[60vh]">
        <DesktopPanelGroup
          primary={<div className={listScrollClassName}>{list}</div>}
          secondary={
            selected
              ? <div className={detailClassName}>{renderDetail(selected)}</div>
              : emptyDetail ?? <WorkbenchEmpty message="Select an item to view details" variant="detail" />
          }
          storageKey="list-detail"
        />
      </div>
    );
  }

  if (splitView) {
    // Tablet: full-page scroll — drop nested max-height / overflow scroll classes.
    const tabletListScrollClassName = listScrollClassName
      .split(/\s+/)
      .filter(
        (token) =>
          token &&
          !token.startsWith('max-h-') &&
          token !== 'overflow-y-auto' &&
          token !== 'overflow-auto'
      )
      .concat('min-h-0')
      .join(' ');

    return (
      <div className="tablet-split-panel">
        <div className={`split-list-pane ${tabletListScrollClassName}`}>{list}</div>
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
