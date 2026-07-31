/**
 * GuardrAvatar — Base Web Avatar wrapper.
 * https://baseweb.design/components/avatar/
 *
 * Uber pattern: circular photo or monogram initials on gray bg.
 */

import React from 'react';
import { Avatar as BaseAvatar } from 'baseui/avatar';
import { useStyletron } from 'baseui';
import { FONT_DISPLAY } from '../../theme/typography';

export type GuardrAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_PX: Record<GuardrAvatarSize, string> = {
  xs: '28px',
  sm: '36px',
  md: '48px',
  lg: '64px',
  xl: '80px',
};

interface GuardrAvatarProps {
  name: string;
  src?: string;
  size?: GuardrAvatarSize;
  className?: string;
}

export function GuardrAvatar({ name, src, size = 'md', className }: GuardrAvatarProps) {
  const [, theme] = useStyletron();
  const px = SIZE_PX[size];

  return (
    <BaseAvatar
      name={name}
      src={src}
      size={px}
      overrides={{
        Root: {
          props: { className },
          style: {
            width: px,
            height: px,
            minWidth: px,
            flexShrink: 0,
          },
        },
        Initials: {
          style: {
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: parseInt(px) < 40 ? '13px' : parseInt(px) < 60 ? '18px' : '24px',
            color: theme.colors.contentPrimary,
            backgroundColor: theme.colors.backgroundSecondary,
          },
        },
      }}
    />
  );
}
