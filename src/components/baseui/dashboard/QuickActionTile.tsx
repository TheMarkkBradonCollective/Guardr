import React from 'react';
import { Block } from 'baseui/block';
import { LabelSmall, ParagraphSmall } from 'baseui/typography';
import { useStyletron } from 'baseui';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
  const [, theme] = useStyletron();

  const bgColor = primary ? theme.colors.accent : theme.colors.backgroundPrimary;
  const borderColor = primary ? 'transparent' : theme.colors.borderOpaque;
  const textColor = primary ? theme.colors.contentOnColor : theme.colors.contentPrimary;
  const iconBg = primary ? 'rgba(255,255,255,0.18)' : theme.colors.accent50;
  const iconColor = primary ? '#fff' : theme.colors.accent;
  const mutedTextColor = primary ? 'rgba(255,255,255,0.82)' : theme.colors.contentSecondary;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      style={{
        all: 'unset',
        display: 'block',
        width: '100%',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.52 : 1,
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease',
      }}
      onMouseDown={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = '';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = '';
      }}
    >
      <Block
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        gridGap="scale300"
        padding="scale500"
        overrides={{
          Block: {
            style: {
              backgroundColor: bgColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '12px',
              minHeight: '120px',
              justifyContent: 'space-between',
            },
          },
        }}
      >
        {/* Icon + arrow row */}
        <Block display="flex" alignItems="flex-start" justifyContent="space-between" width="100%">
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
                  backgroundColor: iconBg,
                  flexShrink: 0,
                },
              },
            }}
          >
            <Icon size={18} color={iconColor} strokeWidth={2} aria-hidden />
          </Block>
          <ArrowRight size={16} color={mutedTextColor} aria-hidden />
        </Block>

        {/* Label */}
        <Block>
          <LabelSmall
            margin={0}
            $style={{ fontWeight: 700, fontSize: '13px', color: textColor, lineHeight: 1.3 }}
          >
            {label}
          </LabelSmall>
          <ParagraphSmall
            margin="4px 0 0"
            $style={{ fontSize: '11px', color: mutedTextColor, lineHeight: 1.4 }}
          >
            {sub}
          </ParagraphSmall>
        </Block>
      </Block>
    </button>
  );
}
