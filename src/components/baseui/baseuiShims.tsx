/* Base Web + React 19 compatibility shims */
import type React from 'react';
import { Tag as BaseTag } from 'baseui/tag';
import { Accordion as BaseAccordion, Panel as BasePanel } from 'baseui/accordion';
import BaseModal from 'baseui/modal';
import BaseDrawer from 'baseui/drawer';
import type { ModalProps } from 'baseui/modal';
import type { DrawerProps } from 'baseui/drawer';

export const Tag = BaseTag as unknown as React.ComponentType<Record<string, unknown>>;
export const Accordion = BaseAccordion as unknown as React.ComponentType<Record<string, unknown>>;
export const Panel = BasePanel as unknown as React.ComponentType<Record<string, unknown>>;
export const Modal = BaseModal as unknown as React.ComponentType<ModalProps>;
export const Drawer = BaseDrawer as unknown as React.ComponentType<DrawerProps>;
