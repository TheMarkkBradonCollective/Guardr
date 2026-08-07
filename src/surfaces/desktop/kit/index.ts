/**
 * Desktop kit — the component vocabulary of the operations centre.
 *
 * Data tables, a command palette, keyboard shortcuts, drag-and-drop, resizable
 * panels, hover cards, and a status bar. Everything here assumes a pointer and a
 * keyboard, which is exactly why none of it is shared with the touch surfaces.
 */

export {
  DesktopButton,
  DesktopCard,
  DesktopColumns,
  DesktopEmpty,
  DesktopFilterChips,
  DesktopIconButton,
  DesktopMetric,
  DesktopMetricGrid,
  DesktopSearchInput,
  DesktopTabs,
  DesktopToolbar,
  DesktopWorkspace,
  type DesktopWorkspaceProps,
} from './DesktopWorkspace';
export {
  DesktopDataTable,
  type DesktopColumn,
  type DesktopDataTableProps,
  type SortDirection,
} from './DesktopDataTable';
export {
  DesktopDialog,
  DesktopHoverCard,
  DesktopInspector,
  DesktopPanelGroup,
  DesktopStatusBar,
  type DesktopDialogProps,
  type DesktopPanelGroupProps,
  type DesktopStatusItem,
} from './DesktopPanels';
export {
  DesktopDragBoard,
  DesktopReorderList,
  type DesktopDragBoardColumn,
  type DesktopDragBoardProps,
  type DragItem,
} from './DesktopDragDrop';
export { DesktopCommandPalette, type DesktopCommandPaletteProps } from './DesktopCommandPalette';
export {
  DesktopSkeletonBlock,
  DesktopSkeletonMetrics,
  DesktopSkeletonScreen,
  DesktopSkeletonTable,
} from './DesktopSkeleton';
export {
  eventCombo,
  expandCombo,
  formatCombo,
  useIsMacPlatform,
  useKeyboardShortcuts,
  type KeyboardShortcut,
} from './useKeyboardShortcuts';
export { filterCommands, groupCommandMatches, matchCommand, type CommandMatch } from './commandMatch';
