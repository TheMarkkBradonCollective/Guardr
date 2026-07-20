import React, { useMemo } from 'react';
import { Block } from 'baseui/block';
import { Navigation } from 'baseui/side-navigation';
import { ParagraphMedium, LabelSmall } from 'baseui/typography';
import type { GuardrNavGroup, GuardrNavItem } from './types';
import { shellNavOverrides } from './shellStyles';

function NavTitle({ item }: { item: GuardrNavItem }) {
  const Icon = item.icon;
  return (
    <Block display="flex" alignItems="center" gridGap="scale400" width="100%">
      {Icon ? <Icon size={18} strokeWidth={2} aria-hidden /> : null}
      <ParagraphMedium $style={{ fontWeight: 600, margin: 0, flex: 1 }}>{item.label}</ParagraphMedium>
      {item.badge != null && item.badge > 0 ? (
        <LabelSmall
          $style={{
            backgroundColor: 'accent',
            color: 'contentInverse',
            borderRadius: '999px',
            padding: '2px 8px',
            fontWeight: 700,
            fontSize: '11px',
            minWidth: '20px',
            textAlign: 'center',
          }}
        >
          {item.badge > 99 ? '99+' : item.badge}
        </LabelSmall>
      ) : null}
    </Block>
  );
}

export function guardrNavItemsFromGroups(groups: GuardrNavGroup[]) {
  return groups.flatMap((group) => {
    const header = group.title
      ? [{ title: group.title.toUpperCase(), itemId: `__group_${group.title}`, disabled: true as const }]
      : [];
    const items = group.items.flatMap((item) => {
      const parent = {
        title: <NavTitle item={item} />,
        itemId: item.id,
        disabled: item.disabled,
      };
      const children = (item.children ?? []).map((child) => ({
        title: (
          <ParagraphMedium
            $style={{
              fontWeight: 500,
              margin: 0,
              fontSize: '14px',
              paddingLeft: '28px',
            }}
          >
            {child.label}
          </ParagraphMedium>
        ),
        itemId: child.id,
        disabled: false as const,
      }));
      return [parent, ...children];
    });
    return [...header, ...items];
  });
}

export function guardrNavItemsFlat(items: GuardrNavItem[]) {
  return guardrNavItemsFromGroups([{ items }]);
}

export function GuardrSideNav({
  groups,
  items,
  activeId,
  onSelect,
  ariaLabel = 'Main navigation',
}: {
  groups?: GuardrNavGroup[];
  items?: GuardrNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  ariaLabel?: string;
}) {
  const navItems = useMemo(
    () => (groups ? guardrNavItemsFromGroups(groups) : guardrNavItemsFlat(items ?? [])),
    [groups, items],
  );

  return (
    <Block aria-label={ariaLabel} role="navigation">
      <Navigation
        items={navItems}
        activeItemId={activeId}
        onChange={({ event, item }) => {
          event.preventDefault();
          const id = String(item.itemId ?? '');
          if (!id.startsWith('__')) onSelect(id);
        }}
        overrides={{
          ...shellNavOverrides,
          NavLink: {
            ...shellNavOverrides.NavLink,
            // Base Web Side Nav never sets aria-current; CSS active tabs key off it.
            props: (props: { $active?: boolean } & Record<string, unknown>) => ({
              ...props,
              'aria-current': props.$active ? 'page' : undefined,
            }),
          },
        } as typeof shellNavOverrides}
      />
    </Block>
  );
}
