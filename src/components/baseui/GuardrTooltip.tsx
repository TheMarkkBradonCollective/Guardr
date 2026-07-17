/**
 * GuardrTooltip — Base Web Tooltip wrapper.
 * https://baseweb.design/components/tooltip/
 *
 * Uber pattern: dark background tooltip with white text.
 */

import React from 'react';
import { StatefulTooltip as BaseTooltip, PLACEMENT } from 'baseui/tooltip';
import { useStyletron } from 'baseui';

export { PLACEMENT };

interface GuardrTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: (typeof PLACEMENT)[keyof typeof PLACEMENT];
  showArrow?: boolean;
}

export function GuardrTooltip({
  content,
  children,
  placement = PLACEMENT.top,
  showArrow = true,
}: GuardrTooltipProps) {
  const [, theme] = useStyletron();

  return (
    <BaseTooltip
      content={content}
      placement={placement}
      showArrow={showArrow}
      overrides={{
        Body: {
          style: {
            backgroundColor: theme.colors.contentPrimary,
            borderRadius: '6px',
            padding: '6px 10px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
          },
        },
        Inner: {
          style: {
            fontSize: '12px',
            fontWeight: 600,
            color: theme.colors.contentInversePrimary,
            backgroundColor: 'transparent',
            padding: 0,
          },
        },
        Arrow: {
          style: {
            backgroundColor: theme.colors.contentPrimary,
          },
        },
      }}
    >
      <span>{children}</span>
    </BaseTooltip>
  );
}
