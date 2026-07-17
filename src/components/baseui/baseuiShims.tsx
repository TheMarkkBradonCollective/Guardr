/* Base Web + React 19 compatibility shims */
import type React from 'react';
import { Tag as BaseTag } from 'baseui/tag';
import { Accordion as BaseAccordion, Panel as BasePanel } from 'baseui/accordion';

export const Tag = BaseTag as unknown as React.ComponentType<Record<string, unknown>>;
export const Accordion = BaseAccordion as unknown as React.ComponentType<Record<string, unknown>>;
export const Panel = BasePanel as unknown as React.ComponentType<Record<string, unknown>>;
