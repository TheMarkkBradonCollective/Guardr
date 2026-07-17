/**
 * Base Web + React 19 compatibility shims.
 *
 * Base Web ships CommonJS types that conflict with React 19's JSX transform.
 * These casts preserve full API while satisfying the type checker.
 * Every component here is a direct re-export — no logic added.
 *
 * Reference: https://baseweb.design/components/
 */

import type React from 'react';

// ─── Overlays ────────────────────────────────────────────────────────────────
import { Modal as BaseModal } from 'baseui/modal';
import { Drawer as BaseDrawer } from 'baseui/drawer';
import type { ModalProps } from 'baseui/modal';
import type { DrawerProps } from 'baseui/drawer';

// ─── Form controls ────────────────────────────────────────────────────────────
import BaseFormControl from 'baseui/form-control';
import { Input as BaseInput } from 'baseui/input';
import { Textarea as BaseTextarea } from 'baseui/textarea';
import { Checkbox as BaseCheckbox } from 'baseui/checkbox';
import { RadioGroup as BaseRadioGroup, Radio as BaseRadio, ALIGN } from 'baseui/radio';
import { Select as BaseSelect } from 'baseui/select';
import { Slider as BaseSlider } from 'baseui/slider';
import { Switch as BaseSwitch } from 'baseui/switch';
import { PinCode as BasePinCode } from 'baseui/pin-code';
import type { FormControlProps } from 'baseui/form-control';
import type { InputProps } from 'baseui/input';
import type { TextareaProps } from 'baseui/textarea';
import type { CheckboxProps } from 'baseui/checkbox';
import type { SelectProps } from 'baseui/select';

// ─── Navigation ───────────────────────────────────────────────────────────────
import { Accordion as BaseAccordion, Panel as BasePanel } from 'baseui/accordion';
import { Tab as BaseTab, Tabs as BaseTabs } from 'baseui/tabs-motion';
import { SegmentedControl as BaseSegmentedControl, Segment as BaseSegment } from 'baseui/segmented-control';

// ─── Feedback & status ────────────────────────────────────────────────────────
import { Notification as BaseNotification } from 'baseui/notification';
import { Spinner as BaseSpinner } from 'baseui/spinner';
import { ProgressBar as BaseProgressBar } from 'baseui/progress-bar';
import { Skeleton as BaseSkeleton } from 'baseui/skeleton';
import { Badge as BaseBadge, COLOR as BADGE_COLOR, SHAPE as BADGE_SHAPE } from 'baseui/badge';
import { Banner as BaseBanner } from 'baseui/banner';
import type { ToastProps } from 'baseui/toast';

// ─── Data display ────────────────────────────────────────────────────────────
import { Avatar as BaseAvatar } from 'baseui/avatar';
import { Tag as BaseTag } from 'baseui/tag';
import { StyledLink as BaseLink } from 'baseui/link';
import { Tooltip as BaseTooltip } from 'baseui/tooltip';
import { Popover as BasePopover } from 'baseui/popover';
import type { AvatarProps } from 'baseui/avatar';

// ─── Layout ───────────────────────────────────────────────────────────────────
import { FlexGrid as BaseFlexGrid, FlexGridItem as BaseFlexGridItem } from 'baseui/flex-grid';

// ─── Type casts — preserve full APIs ─────────────────────────────────────────

export const Modal    = BaseModal    as unknown as React.ComponentType<ModalProps>;
export const Drawer   = BaseDrawer   as unknown as React.ComponentType<DrawerProps>;
export const FormControl = BaseFormControl as unknown as React.ComponentType<FormControlProps>;
export const Input    = BaseInput    as unknown as React.ComponentType<InputProps>;
export const Textarea = BaseTextarea as unknown as React.ComponentType<TextareaProps>;
export const Checkbox = BaseCheckbox as unknown as React.ComponentType<CheckboxProps>;
export const RadioGroup = BaseRadioGroup as unknown as React.ComponentType<Record<string, unknown>>;
export const Radio    = BaseRadio    as unknown as React.ComponentType<Record<string, unknown>>;
export const Select   = BaseSelect   as unknown as React.ComponentType<SelectProps>;
export const Slider   = BaseSlider   as unknown as React.ComponentType<Record<string, unknown>>;
export const Switch   = BaseSwitch   as unknown as React.ComponentType<Record<string, unknown>>;
export const PinCode  = BasePinCode  as unknown as React.ComponentType<Record<string, unknown>>;
export const Accordion = BaseAccordion as unknown as React.ComponentType<Record<string, unknown>>;
export const Panel    = BasePanel    as unknown as React.ComponentType<Record<string, unknown>>;
export const Tabs     = BaseTabs     as unknown as React.ComponentType<Record<string, unknown>>;
export const Tab      = BaseTab      as unknown as React.ComponentType<Record<string, unknown>>;
export const SegmentedControl = BaseSegmentedControl as unknown as React.ComponentType<Record<string, unknown>>;
export const Segment  = BaseSegment  as unknown as React.ComponentType<Record<string, unknown>>;
export const Notification = BaseNotification as unknown as React.ComponentType<ToastProps>;
export const Spinner  = BaseSpinner  as unknown as React.ComponentType<Record<string, unknown>>;
export const ProgressBar = BaseProgressBar as unknown as React.ComponentType<Record<string, unknown>>;
export const Skeleton = BaseSkeleton as unknown as React.ComponentType<Record<string, unknown>>;
export const Badge    = BaseBadge    as unknown as React.ComponentType<Record<string, unknown>>;
export const Banner   = BaseBanner   as unknown as React.ComponentType<Record<string, unknown>>;
export const Avatar   = BaseAvatar   as unknown as React.ComponentType<AvatarProps>;
export const Tag      = BaseTag      as unknown as React.ComponentType<Record<string, unknown>>;
export const StyledLink = BaseLink   as unknown as React.ComponentType<Record<string, unknown>>;
export const Tooltip  = BaseTooltip  as unknown as React.ComponentType<Record<string, unknown>>;
export const Popover  = BasePopover  as unknown as React.ComponentType<Record<string, unknown>>;
export const FlexGrid = BaseFlexGrid as unknown as React.ComponentType<Record<string, unknown>>;
export const FlexGridItem = BaseFlexGridItem as unknown as React.ComponentType<Record<string, unknown>>;

// Re-export constants
export { ALIGN, BADGE_COLOR, BADGE_SHAPE };
