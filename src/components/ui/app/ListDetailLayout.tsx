import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useMediaQuery } from '../../../lib/platform';
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
  const portrait = useMediaQuery('(orientation: portrait)');

  const allowAutoSelect = autoSelectFirst && (desktopView || (splitView && !portrait));
  const resolvedSelectedId =
    selectedId ?? (allowAutoSelect && items.length > 0 ? getItemId(items[0]) : null);

  const selected = items.find((item) => getItemId(item) === resolvedSelectedId) ?? null;
  const hasSelection = selected != null;
  const closeDetail = () => onSelectId(null);

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
      <div className="h-full min-h-0">
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
      <div
        className="tablet-split-panel"
        data-selected={hasSelection ? 'true' : undefined}
        data-orientation={portrait ? 'portrait' : 'landscape'}
      >
        <div className={`split-list-pane ${tabletListScrollClassName}`}>{list}</div>
        <div className={`split-detail-pane min-h-0 ${detailClassName}`}>
          {hasSelection && portrait ? (
            <div className="tablet-split-back">
              <button type="button" className="sft-icon-btn" onClick={closeDetail} aria-label="Back to list">
                <ChevronLeft size={22} strokeWidth={2.25} aria-hidden />
              </button>
              <span className="tablet-split-back-title">Back to list</span>
            </div>
          ) : null}
          {selected
            ? renderDetail(selected, portrait ? { onBack: closeDetail } : undefined)
            : emptyDetail}
        </div>
      </div>
    );
  }

  if (showDetailOnly && selected) {
    return renderDetail(selected, { onBack: closeDetail });
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
