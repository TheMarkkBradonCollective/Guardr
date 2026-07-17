import React from 'react';
import { Block } from 'baseui/block';
import { useStyletron } from 'baseui';
import { LayoutGrid, Map, type LucideIcon } from 'lucide-react';
import { iconRailItemStyle } from './shellStyles';
import type { GuardrNavItem } from './types';

export function GuardrIconRail({
  items,
  activeId,
  onSelect,
  brand,
  footer,
  ariaLabel = 'Main navigation',
}: {
  items: GuardrNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  brand?: React.ReactNode;
  footer?: React.ReactNode;
  ariaLabel?: string;
}) {
  const [, theme] = useStyletron();

  return (
    <Block
      as="aside"
      aria-label={ariaLabel}
      display="flex"
      flexDirection="column"
      height="100%"
      backgroundColor="backgroundPrimary"
      overrides={{
        Block: {
          style: {
            width: '72px',
            flexShrink: 0,
            borderRight: `1px solid ${theme.colors.borderOpaque}`,
          },
        },
      }}
    >
      {brand ? (
        <Block padding="scale500" overrides={{ Block: { style: { borderBottom: `1px solid ${theme.colors.borderOpaque}` } } }}>
          {brand}
        </Block>
      ) : null}

      <Block
        as="nav"
        flex="1"
        overflow="auto"
        display="flex"
        flexDirection="column"
        alignItems="center"
        gridGap="scale200"
        paddingTop="scale400"
        paddingBottom="scale400"
      >
        {items.map(({ id, label, icon: Icon, badge }) => {
          const active = activeId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
              title={label}
              style={iconRailItemStyle(theme, active)}
            >
              {Icon ? <Icon size={22} strokeWidth={active ? 2.5 : 2} /> : null}
              {badge != null && badge > 0 ? (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    minWidth: 16,
                    height: 16,
                    padding: '0 4px',
                    borderRadius: 9999,
                    background: theme.colors.contentPrimary,
                    color: theme.colors.contentInversePrimary,
                    fontSize: 10,
                    fontWeight: 700,
                    lineHeight: '16px',
                    textAlign: 'center',
                  }}
                >
                  {badge > 9 ? '9+' : badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </Block>

      {footer ? <Block padding="scale400">{footer}</Block> : null}
    </Block>
  );
}

export type GuardrBottomNavItem = GuardrNavItem;

interface GuardrBottomNavProps {
  items: GuardrBottomNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  showMore?: boolean;
  moreActive?: boolean;
  moreBadge?: number;
  onMoreClick?: () => void;
  flat?: boolean;
  centerItemId?: string;
}

/** Individual bottom nav tab — real Uber style: black active, gray inactive */
function BottomNavTab({
  label,
  icon: Icon,
  active,
  badge,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  const [, theme] = useStyletron();
  const color = active ? theme.colors.contentPrimary : theme.colors.contentSecondary;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minHeight: '56px',
        padding: '8px 4px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        color,
        fontFamily: 'inherit',
        transition: 'color 120ms ease',
      }}
    >
      <span style={{ position: 'relative', display: 'flex' }}>
        <Icon
          size={22}
          strokeWidth={active ? 2.5 : 2}
          color={color}
        />
        {badge != null && badge > 0 ? (
          <span
            style={{
              position: 'absolute',
              top: -5,
              right: -8,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 9999,
              background: theme.colors.contentPrimary,
              color: theme.colors.contentInversePrimary,
              fontSize: 10,
              fontWeight: 700,
              lineHeight: '16px',
              textAlign: 'center',
            }}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </span>
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, lineHeight: 1, color }}>
        {label}
      </span>
    </button>
  );
}

/** Guardr bottom navigation — real Uber app style */
export function GuardrBottomNav({
  items,
  activeId,
  onNavigate,
  showMore = false,
  moreActive = false,
  moreBadge = 0,
  onMoreClick,
  flat = false,
  centerItemId = 'map',
}: GuardrBottomNavProps) {
  const [, theme] = useStyletron();
  const primarySlots = showMore ? items.slice(0, 4) : items.slice(0, 5);
  const centerIndex = primarySlots.findIndex((item) => item.id === centerItemId);
  const hasCenter   = centerIndex >= 0;
  const leftItems   = hasCenter ? primarySlots.slice(0, centerIndex) : primarySlots;
  const centerItem  = hasCenter ? primarySlots[centerIndex] : null;
  const rightItems  = hasCenter ? primarySlots.slice(centerIndex + 1) : [];

  return (
    <Block
      as="nav"
      aria-label="Main navigation"
      backgroundColor="backgroundPrimary"
      overrides={{
        Block: {
          style: {
            flexShrink: 0,
            zIndex: 50,
            borderTop: `1px solid ${theme.colors.borderOpaque}`,
            backgroundColor: theme.colors.backgroundPrimary,
            paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
          },
        },
      }}
    >
      <Block display="flex" alignItems="flex-end" justifyContent="space-around" width="100%">
        {leftItems.map((item) => (
          <BottomNavTab
            key={item.id}
            label={item.label}
            icon={item.icon ?? Map}
            active={activeId === item.id}
            badge={item.badge}
            onClick={() => onNavigate(item.id)}
          />
        ))}

        {centerItem ? (
          <BottomNavTab
            key={centerItem.id}
            label={centerItem.label}
            icon={centerItem.icon ?? Map}
            active={activeId === centerItem.id}
            badge={centerItem.badge}
            onClick={() => onNavigate(centerItem.id)}
          />
        ) : null}

        {rightItems.map((item) => (
          <BottomNavTab
            key={item.id}
            label={item.label}
            icon={item.icon ?? Map}
            active={activeId === item.id}
            badge={item.badge}
            onClick={() => onNavigate(item.id)}
          />
        ))}

        {showMore ? (
          <BottomNavTab
            label="More"
            icon={LayoutGrid}
            active={moreActive}
            badge={moreBadge}
            onClick={() => onMoreClick?.()}
          />
        ) : null}
      </Block>
    </Block>
  );
}
