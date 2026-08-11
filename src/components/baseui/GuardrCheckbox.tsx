/**
 * GuardrCheckbox — Base Web Checkbox wrapper.
 * https://baseweb.design/components/checkbox/
 *
 * Base Web pattern: black checkmark, minimal styling.
 */

import React from 'react';
import { Checkbox as BaseCheckbox, STYLE_TYPE, LABEL_PLACEMENT } from 'baseui/checkbox';
import type { CheckboxProps } from 'baseui/checkbox';
import { useStyletron } from 'baseui';

export interface GuardrCheckboxProps extends Omit<CheckboxProps, 'overrides'> {
  toggle?: boolean;
  overrides?: CheckboxProps['overrides'];
}

export function GuardrCheckbox({
  toggle = false,
  children,
  overrides,
  ...rest
}: GuardrCheckboxProps) {
  const [, theme] = useStyletron();

  return (
    <BaseCheckbox
      checkmarkType={toggle ? STYLE_TYPE.toggle_round : STYLE_TYPE.default}
      labelPlacement={LABEL_PLACEMENT.right}
      overrides={{
        Checkmark: {
          style: ({ $checked }: { $checked?: boolean }) => ({
            borderRadius: toggle ? '999px' : '4px',
            backgroundColor: $checked ? theme.colors.contentPrimary : 'transparent',
            borderColor: $checked ? theme.colors.contentPrimary : theme.colors.borderOpaque,
            width: toggle ? '44px' : '18px',
            height: toggle ? '24px' : '18px',
            transition: 'background-color 120ms ease, border-color 120ms ease',
          }),
        },
        Label: {
          style: {
            fontSize: '15px',
            fontWeight: 500,
            color: theme.colors.contentPrimary,
            lineHeight: 1.4,
            paddingLeft: theme.sizing.scale400,
          },
        },
        Root: {
          style: {
            alignItems: 'center',
            minHeight: '44px',
            cursor: rest.disabled ? 'not-allowed' : 'pointer',
          },
        },
        ...overrides,
      }}
      {...rest}
    >
      {children}
    </BaseCheckbox>
  );
}
