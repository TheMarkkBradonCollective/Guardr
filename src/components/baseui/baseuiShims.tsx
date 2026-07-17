/* Base Web + React 19 compatibility shims */
import type React from 'react';
import { Tag as BaseTag } from 'baseui/tag';

export const Tag = BaseTag as unknown as React.ComponentType<Record<string, unknown>>;
