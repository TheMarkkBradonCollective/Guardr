import React from 'react';
import { GuardrBottomNav, type GuardrBottomNavItem } from '../baseui/layout/GuardrBottomNav';
import type { LucideIcon } from 'lucide-react';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface BottomNavBarProps {
  items: BottomNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  showMore?: boolean;
  moreActive?: boolean;
  moreBadge?: number;
  onMoreClick?: () => void;
  flat?: boolean;
  /** Renders this tab as a raised center map button (Sacramento Buy Nothing-style). */
  centerItemId?: string;
}

export function BottomNavBar(props: BottomNavBarProps) {
  return <GuardrBottomNav {...props} items={props.items as GuardrBottomNavItem[]} />;
}
