/**
 * GuardrSkeleton — Base Web Skeleton wrapper.
 * https://baseweb.design/components/skeleton/
 *
 * Uber pattern: gray shimmer on #f6f6f6, no colored shimmer.
 */

import React from 'react';
import { Skeleton } from './baseuiShims';
import { useStyletron } from 'baseui';
import { prefersReducedMotion } from '../../theme/motionTokens';

interface GuardrSkeletonProps {
  width?: string;
  height?: string;
  circle?: boolean;
  rows?: number;
  animation?: boolean;
  className?: string;
}

export function GuardrSkeleton({
  width = '100%',
  height = '14px',
  circle = false,
  rows = 1,
  animation,
  className,
}: GuardrSkeletonProps) {
  const [, theme] = useStyletron();
  const animate = animation ?? !prefersReducedMotion();

  if (rows > 1) {
    return (
      <Skeleton
        rows={rows}
        animation={animate}
        overrides={{
          Row: {
            style: {
              height,
              borderRadius: '6px',
              backgroundColor: theme.colors.backgroundSecondary,
              marginBottom: theme.sizing.scale300,
            },
          },
          Root: {
            props: { className },
            style: { width },
          },
        }}
      />
    );
  }

  return (
    <Skeleton
      rows={1}
      animation={animate}
      overrides={{
        Row: {
          style: {
            width,
            height,
            borderRadius: circle ? '50%' : '6px',
            backgroundColor: theme.colors.backgroundSecondary,
          },
        },
        Root: {
          props: { className },
        },
      }}
    />
  );
}
