import React from 'react';
import {
  Card as BaseCard,
  StyledBody,
  StyledAction,
  StyledTitle,
  hasThumbnail as cardHasThumbnail,
} from 'baseui/card';
import type { CardProps } from 'baseui/card';
import { useStyletron } from 'baseui';

export type GuardrCardVariant = 'default' | 'elevated' | 'service' | 'selected';

export type GuardrCardProps = Omit<CardProps, 'overrides'> & {
  interactive?: boolean;
  title?: React.ReactNode;
  action?: React.ReactNode;
  noBorder?: boolean;
  noBackground?: boolean;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  overrides?: CardProps['overrides'];
  selected?: boolean;
  variant?: GuardrCardVariant;
};

/**
 * Guardr card — Production Guardr app style.
 * White background, very light border, minimal shadow.
 * "service" variant: gray background (#F6F6F6) like Base Web service tiles.
 * "selected" variant: black border like Base Web selected ride card.
 */
export function GuardrCard({
  children,
  interactive = false,
  title,
  action,
  noBorder = false,
  noBackground = false,
  className,
  onClick,
  overrides,
  selected = false,
  variant = 'default',
  ...rest
}: GuardrCardProps) {
  const [, theme] = useStyletron();

  const bgColor =
    noBackground    ? 'transparent' :
    variant === 'service' ? theme.colors.backgroundSecondary :
    theme.colors.backgroundPrimary;

  const borderColor =
    noBorder        ? 'transparent' :
    selected        ? theme.colors.contentPrimary :
    variant === 'service' ? 'transparent' :
    theme.colors.borderOpaque;

  const borderWidth = selected ? '2px' : '1px';

  return (
    <BaseCard
      {...rest}
      hasThumbnail={cardHasThumbnail}
      overrides={{
        Root: {
          props: { className, onClick },
          style: {
            borderRadius: '12px',
            border: `${borderWidth} solid ${borderColor}`,
            backgroundColor: bgColor,
            boxShadow: 'none',
            cursor: interactive || onClick ? 'pointer' : undefined,
            transition: interactive
              ? 'border-color 120ms ease, background-color 120ms ease, transform 120ms ease'
              : undefined,
            ':hover': interactive
              ? {
                  transform: 'translateY(-1px)',
                  borderColor: selected ? theme.colors.contentPrimary : theme.colors.borderOpaque,
                }
              : undefined,
            ':active': interactive ? { transform: 'scale(0.98)' } : undefined,
            ...(typeof overrides?.Root?.style === 'object' ? overrides.Root.style : {}),
          },
          ...(typeof overrides?.Root?.props === 'object' ? overrides.Root.props : {}),
        },
        ...overrides,
      }}
    >
      {title ? <StyledTitle>{title as React.ReactNode}</StyledTitle> : null}
      <StyledBody>{children as React.ReactNode}</StyledBody>
      {action ? <StyledAction>{action as React.ReactNode}</StyledAction> : null}
    </BaseCard>
  );
}

export { StyledBody as GuardrCardBody, StyledAction as GuardrCardAction, StyledTitle as GuardrCardTitle };
