/**
 * Tablet kit — the component vocabulary of the tablet application.
 *
 * Split views, docked side panels, and a persistent inspector column. These are
 * for the tablet surface only; the mobile and desktop kits are separate on
 * purpose.
 */

export {
  TabletButton,
  TabletCard,
  TabletCardGrid,
  TabletEmpty,
  TabletInspector,
  TabletMasterList,
  TabletMetric,
  TabletScreen,
  TabletSidePanel,
  TabletSplitView,
  TabletTabs,
  TabletToolbar,
  type TabletMasterListItem,
  type TabletScreenProps,
  type TabletSidePanelProps,
  type TabletSplitViewProps,
} from './TabletLayout';
export {
  TabletSkeletonBlock,
  TabletSkeletonDetail,
  TabletSkeletonGrid,
  TabletSkeletonMaster,
  TabletSkeletonScreen,
} from './TabletSkeleton';
