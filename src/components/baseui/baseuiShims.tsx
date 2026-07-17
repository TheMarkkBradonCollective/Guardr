/* Base Web + React 19 compatibility shims */
import type React from 'react';
import { Tag as BaseTag } from 'baseui/tag';
import { Accordion as BaseAccordion, Panel as BasePanel } from 'baseui/accordion';
import { Modal as BaseModal } from 'baseui/modal';
import { Drawer as BaseDrawer } from 'baseui/drawer';
import BaseFormControl from 'baseui/form-control';
import { Input as BaseInput } from 'baseui/input';
import { Textarea as BaseTextarea } from 'baseui/textarea';
import { Notification as BaseNotification } from 'baseui/notification';
import type { ModalProps } from 'baseui/modal';
import type { DrawerProps } from 'baseui/drawer';
import type { FormControlProps } from 'baseui/form-control';
import type { InputProps } from 'baseui/input';
import type { TextareaProps } from 'baseui/textarea';
import type { ToastProps } from 'baseui/toast';

export const Tag = BaseTag as unknown as React.ComponentType<Record<string, unknown>>;
export const Accordion = BaseAccordion as unknown as React.ComponentType<Record<string, unknown>>;
export const Panel = BasePanel as unknown as React.ComponentType<Record<string, unknown>>;
export const Modal = BaseModal as unknown as React.ComponentType<ModalProps>;
export const Drawer = BaseDrawer as unknown as React.ComponentType<DrawerProps>;
export const FormControl = BaseFormControl as unknown as React.ComponentType<FormControlProps>;
export const Input = BaseInput as unknown as React.ComponentType<InputProps>;
export const Textarea = BaseTextarea as unknown as React.ComponentType<TextareaProps>;
export const Notification = BaseNotification as unknown as React.ComponentType<ToastProps>;
