/**
 * Guardr Base Web component library.
 *
 * All UI primitives built on https://baseweb.design/ with Uber's design
 * language (black/white, flat cards, Uber Move typography).
 *
 * Usage:
 *   import { GuardrButton, GuardrInput, GuardrSpinner } from '@/src/components/baseui';
 */

// ─── Provider ─────────────────────────────────────────────────────────────────
export { BaseUIProvider } from './BaseUIProvider';

// ─── Core primitives ─────────────────────────────────────────────────────────
export { GuardrButton }       from './GuardrButton';
export type { GuardrButtonProps, GuardrButtonKind } from './GuardrButton';

export { GuardrCard, GuardrCardBody, GuardrCardAction, GuardrCardTitle } from './GuardrCard';
export type { GuardrCardProps, GuardrCardVariant } from './GuardrCard';

export { GuardrInput }        from './GuardrInput';
export type { GuardrInputProps } from './GuardrInput';

export { GuardrTag }          from './GuardrTag';
export type { GuardrTagKind } from './GuardrTag';

export { GuardrSkeleton }     from './GuardrSkeleton';

// ─── Form controls ────────────────────────────────────────────────────────────
export { GuardrCheckbox }     from './GuardrCheckbox';
export type { GuardrCheckboxProps } from './GuardrCheckbox';

export { GuardrSelect }       from './GuardrSelect';
export type { Option } from './GuardrSelect';

export { GuardrSwitch }       from './GuardrSwitch';

export { GuardrFormControl }  from './GuardrFormControl';

// ─── Feedback & status ────────────────────────────────────────────────────────
export { GuardrSpinner }      from './GuardrSpinner';
export type { GuardrSpinnerSize } from './GuardrSpinner';

export { GuardrProgressBar }  from './GuardrProgressBar';

export { GuardrNotification } from './GuardrNotification';
export type { GuardrNotificationKind } from './GuardrNotification';

export { GuardrBadge, GuardrStatusDot } from './GuardrBadge';

// ─── Navigation & layout ─────────────────────────────────────────────────────
export { GuardrTabs }         from './GuardrTabs';
export type { GuardrTab } from './GuardrTabs';

export { GuardrSegmented }    from './GuardrSegmented';
export type { SegmentOption } from './GuardrSegmented';

// ─── Data display ────────────────────────────────────────────────────────────
export { GuardrAvatar }       from './GuardrAvatar';
export type { GuardrAvatarSize } from './GuardrAvatar';

export { GuardrTooltip, PLACEMENT as TooltipPlacement } from './GuardrTooltip';

// ─── App shell layouts ────────────────────────────────────────────────────────
export { GuardrDrawerShell }  from './layout/GuardrDrawerShell';
export { GuardrSideNav }      from './layout/GuardrSideNav';
export { GuardrBottomNav, GuardrIconRail } from './layout/GuardrBottomNav';
export type { GuardrBottomNavItem } from './layout/GuardrBottomNav';

// ─── Overlays ─────────────────────────────────────────────────────────────────
export { GuardrModal }        from './overlays/GuardrModal';
export { GuardrSheet }        from './overlays/GuardrSheet';
export { GuardrDrawer }       from './overlays/GuardrDrawer';
export { OverlaySheetHeader } from './overlays/OverlaySheetHeader';

// ─── Dashboard building blocks ────────────────────────────────────────────────
export { DashboardHero, AccentIcon, MutedIcon } from './dashboard/DashboardHero';
export { DashboardZone }      from './dashboard/DashboardZone';
export { MetricCell, MetricStrip } from './dashboard/MetricCell';
export type { MetricTrend } from './dashboard/MetricCell';
export { QuickActionTile }    from './dashboard/QuickActionTile';
export { UberThemeVars }      from './dashboard/themeVars';

// ─── Primitives ───────────────────────────────────────────────────────────────
export { inputOverrides, textareaOverrides, formControlOverrides } from './primitives/fieldStyles';

// ─── Re-export Base Web shims for direct use ──────────────────────────────────
export {
  Spinner, ProgressBar, Badge, Avatar, Notification,
  Tabs, Tab, SegmentedControl, Segment,
  Checkbox, RadioGroup, Radio, Select, Switch, Slider, PinCode,
  Tooltip, Popover, StyledLink,
  FlexGrid, FlexGridItem,
  Accordion, Panel,
  Modal, Drawer, FormControl, Input, Textarea,
} from './baseuiShims';
