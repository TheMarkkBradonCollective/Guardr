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

/** Individual tab — exact Uber driver/rider tab bar */
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
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className="uber-tab-btn"
      data-active={active ? 'true' : undefined}
    >
      <span className="uber-tab-icon-wrap">
        <Icon size={24} strokeWidth={active ? 2.25 : 1.75} className="uber-tab-icon" />
        {badge != null && badge > 0 ? (
          <span className="uber-tab-badge">{badge > 9 ? '9+' : badge}</span>
        ) : null}
      </span>
      <span className="uber-tab-label">{label}</span>
      {active && <span className="uber-tab-active-dot" aria-hidden />}
    </button>
  );
}

/** Guardr bottom navigation — exact Uber tab bar */
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
  const allTabs = showMore ? items.slice(0, 4) : items.slice(0, 5);

  return (
    <nav aria-label="Main navigation" className="uber-bottom-nav">
      <div className="uber-bottom-nav-inner">
        {allTabs.map((item) => (
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
      </div>
    </nav>
  );
}
