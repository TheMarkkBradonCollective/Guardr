import type { LucideIcon } from 'lucide-react';

export type GuardrNavItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
  disabled?: boolean;
};

export type GuardrNavGroup = {
  title?: string;
  items: GuardrNavItem[];
};
