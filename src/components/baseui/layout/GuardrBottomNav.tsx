import React from 'react';
import { Block } from 'baseui/block';
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
            borderRight: '1px solid',
            borderColor: 'borderOpaque',
          },
        },
      }}
    >
      {brand ? (
        <Block padding="scale500" overrides={{ Block: { style: { borderBottom: '1px solid', borderColor: 'borderOpaque' } } }}>
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
              style={iconRailItemStyle(active)}
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
                    background: 'var(--brand-primary)',
                    color: '#fff',
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

function BottomNavButton({
  label,
  icon: Icon,
  active,
  badge,
  onClick,
  className = '',
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  badge?: number;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-current={active ? 'page' : undefined}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minHeight: '52px',
        padding: '8px 4px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        color: active ? 'var(--brand-primary)' : 'var(--brand-text-muted)',
        transition: 'color 150ms ease, transform 150ms ease',
      }}
    >
      <span style={{ position: 'relative' }}>
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        {badge != null && badge > 0 ? (
          <span
            style={{
              position: 'absolute',
              top: -6,
              right: -8,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 9999,
              background: 'var(--brand-primary)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              lineHeight: '16px',
            }}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </span>
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, lineHeight: 1 }}>{label}</span>
    </button>
  );
}

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
  const primarySlots = showMore ? items.slice(0, 4) : items.slice(0, 5);
  const centerIndex = primarySlots.findIndex((item) => item.id === centerItemId);
  const hasCenter = centerIndex >= 0;
  const leftItems = hasCenter ? primarySlots.slice(0, centerIndex) : primarySlots;
  const centerItem = hasCenter ? primarySlots[centerIndex] : null;
  const rightItems = hasCenter ? primarySlots.slice(centerIndex + 1) : [];

  return (
    <Block
      as="nav"
      aria-label="Main navigation"
      backgroundColor={flat ? 'backgroundPrimary' : 'backgroundPrimary'}
      overrides={{
        Block: {
          style: {
            flexShrink: 0,
            zIndex: 1001,
            borderTop: '1px solid',
            borderColor: 'borderOpaque',
            backdropFilter: flat ? undefined : 'blur(20px) saturate(150%)',
            backgroundColor: flat ? 'var(--brand-bg)' : 'color-mix(in srgb, var(--brand-surface) 92%, transparent)',
            boxShadow: 'var(--shadow-nav)',
            paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
          },
        },
      }}
    >
      <Block display="flex" alignItems="flex-end" justifyContent="space-around" width="100%">
        {leftItems.map((item) => (
          <BottomNavButton
            key={item.id}
            label={item.label}
            icon={item.icon ?? Map}
            active={activeId === item.id}
            badge={item.badge}
            onClick={() => onNavigate(item.id)}
          />
        ))}

        {centerItem ? (
          <button
            type="button"
            onClick={() => onNavigate(centerItem.id)}
            aria-current={activeId === centerItem.id ? 'page' : undefined}
            aria-label={centerItem.label}
            className="bottom-nav-center-map"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minHeight: 52,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <span
              className={`bottom-nav-center-map-icon${activeId === centerItem.id ? ' bottom-nav-center-map-active' : ''}`}
            >
              <Map size={24} strokeWidth={activeId === centerItem.id ? 2.5 : 2} />
            </span>
            <span className="bottom-nav-center-map-label">{centerItem.label}</span>
          </button>
        ) : null}

        {rightItems.map((item) => (
          <BottomNavButton
            key={item.id}
            label={item.label}
            icon={item.icon ?? Map}
            active={activeId === item.id}
            badge={item.badge}
            onClick={() => onNavigate(item.id)}
          />
        ))}

        {showMore ? (
          <BottomNavButton
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
