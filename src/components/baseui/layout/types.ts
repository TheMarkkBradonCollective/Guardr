import type { LucideIcon } from 'lucide-react';

export type GuardrNavSubItem = {
  id: string;
  label: string;
};

export type GuardrNavItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
  disabled?: boolean;
  /** Uber Direct nested nav (e.g. Jobs → Today / Future / Past). */
  children?: GuardrNavSubItem[];
};

export type GuardrNavGroup = {
  title?: string;
  items: GuardrNavItem[];
};
