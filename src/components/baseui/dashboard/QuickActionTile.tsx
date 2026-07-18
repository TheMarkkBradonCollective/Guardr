import React from 'react';
import { Block } from 'baseui/block';
import { LabelSmall, ParagraphSmall } from 'baseui/typography';
import { useStyletron } from 'baseui';
import type { LucideIcon } from 'lucide-react';

/**
 * Guardr quick-action tile — Uber home grid style.
 * Gray square icon + label below (like Uber's Food / Reserve / 2-Wheels tiles).
 * Primary variant: black background, white text.
 */
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

  const bgColor     = primary ? '#000000' : theme.colors.backgroundSecondary;
  const iconColor   = primary ? '#FFFFFF' : theme.colors.contentPrimary;
  const textColor   = primary ? '#FFFFFF' : theme.colors.contentPrimary;
  const subColor    = primary ? 'rgba(255,255,255,0.72)' : theme.colors.contentSecondary;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      style={{
        all: 'unset',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: '100%',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'opacity 120ms ease, transform 120ms ease',
      }}
      onMouseDown={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
      }}
      onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
    >
      <Block
        className="uber-quick-tile-surface"
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        gridGap="scale300"
        padding="scale500"
        width="100%"
        overrides={{
          Block: {
            style: {
              backgroundColor: bgColor,
              borderRadius: '12px',
              minHeight: '110px',
              boxSizing: 'border-box',
            },
          },
        }}
      >
        {/* Icon square */}
        <Block
          className="uber-quick-tile-icon"
          display="flex"
          alignItems="center"
          justifyContent="center"
          width="40px"
          height="40px"
          overrides={{
            Block: {
              style: {
                borderRadius: '10px',
                backgroundColor: primary
                  ? 'transparent'
                  : theme.colors.backgroundPrimary,
                flexShrink: 0,
              },
            },
          }}
        >
          <Icon size={20} color={iconColor} strokeWidth={2} aria-hidden />
        </Block>

        {/* Text */}
        <Block className="uber-quick-tile-copy">
          <LabelSmall
            margin={0}
            $style={{ fontWeight: 700, fontSize: '13px', color: textColor, lineHeight: 1.25 }}
          >
            {label}
          </LabelSmall>
          <ParagraphSmall
            margin="4px 0 0"
            $style={{ fontSize: '11px', color: subColor, lineHeight: 1.35 }}
          >
            {sub}
          </ParagraphSmall>
        </Block>
      </Block>
    </button>
  );
}
