import React from 'react';
import { Card as BaseCard, StyledBody, StyledAction, StyledTitle } from 'baseui/card';
import type { CardProps } from 'baseui/card';

export type GuardrCardProps = Omit<CardProps, 'overrides'> & {
  interactive?: boolean;
  title?: React.ReactNode;
  action?: React.ReactNode;
  noBorder?: boolean;
  className?: string;
  overrides?: CardProps['overrides'];
};

export function GuardrCard({
  children,
  interactive = false,
  title,
  action,
  noBorder = false,
  className,
  overrides,
  ...rest
}: GuardrCardProps) {
  return (
    <BaseCard
      {...rest}
      overrides={{
        Root: {
          props: {
            className,
            ...(typeof overrides?.Root?.props === 'object' ? overrides.Root.props : {}),
          },
          style: {
            borderRadius: '14px',
            border: noBorder ? 'none' : '1px solid',
            borderColor: 'borderOpaque',
            boxShadow: 'none',
            backgroundColor: 'backgroundPrimary',
            transition: interactive
              ? 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms ease'
              : undefined,
            ':hover': interactive
              ? {
                  transform: 'translateY(-2px)',
                  borderColor: 'accent',
                }
              : undefined,
            ...(typeof overrides?.Root?.style === 'object' ? overrides.Root.style : {}),
          },
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
