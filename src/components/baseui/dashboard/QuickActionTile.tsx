import React from 'react';
import { Block } from 'baseui/block';
import { LabelSmall, ParagraphSmall } from 'baseui/typography';
import type { LucideIcon } from 'lucide-react';
import { GuardrCard } from '../GuardrCard';

export function QuickActionTile({
  icon: Icon,
  label,
  sub,
  primary = false,
  disabled = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  sub: string;
  primary?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`client-home-quick-tile ${primary ? 'client-home-quick-tile-primary' : ''} ${disabled ? 'client-home-action-muted' : ''}`}
      aria-disabled={disabled}
    >
      <GuardrCard
        interactive
        noBorder
        overrides={{
          Root: {
            style: {
              width: '100%',
              backgroundColor: primary ? 'accent' : 'backgroundPrimary',
              color: primary ? 'contentOnColor' : 'contentPrimary',
              border: primary ? 'none' : '1px solid',
              borderColor: primary ? 'transparent' : 'borderOpaque',
            },
          },
        }}
      >
        <Block display="flex" flexDirection="column" alignItems="flex-start" gridGap="scale200" padding="scale500">
          <Block
            display="flex"
            alignItems="center"
            justifyContent="center"
            width="36px"
            height="36px"
            overrides={{
              Block: {
                style: {
                  borderRadius: '10px',
                  backgroundColor: primary ? 'rgba(255,255,255,0.16)' : 'accent50',
                  color: primary ? 'contentOnColor' : 'accent',
                },
              },
            }}
          >
            <Icon className="w-4 h-4" strokeWidth={2} />
          </Block>
          <LabelSmall margin={0} $style={{ fontWeight: 700, fontSize: '13px', color: 'inherit' }}>
            {label}
          </LabelSmall>
          <ParagraphSmall margin={0} $style={{ fontSize: '11px', opacity: primary ? 0.9 : 0.72, color: 'inherit' }}>
            {sub}
          </ParagraphSmall>
        </Block>
      </GuardrCard>
    </button>
  );
}
