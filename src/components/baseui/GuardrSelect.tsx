/**
 * GuardrSelect — Base Web Select wrapper.
 * https://baseweb.design/components/select/
 *
 * Uber pattern: gray-fill dropdown, no heavy borders.
 */

import React from 'react';
import { Select } from './baseuiShims';
import type { SelectProps, Option } from 'baseui/select';
import { useStyletron } from 'baseui';

export type { Option };

interface GuardrSelectProps extends Omit<SelectProps, 'overrides'> {
  overrides?: SelectProps['overrides'];
}

export function GuardrSelect({ overrides, ...rest }: GuardrSelectProps) {
  const [, theme] = useStyletron();

  return (
    <Select
      overrides={{
        ControlContainer: {
          style: {
            backgroundColor: theme.colors.backgroundSecondary,
            border: 'none',
            borderRadius: '8px',
            minHeight: '52px',
            transition: 'background-color 120ms ease',
          },
        },
        ValueContainer: {
          style: {
            paddingLeft: '16px',
            paddingRight: '8px',
            fontSize: '15px',
            fontWeight: 500,
            color: theme.colors.contentPrimary,
          },
        },
        Placeholder: {
          style: {
            color: theme.colors.contentSecondary,
            fontSize: '15px',
          },
        },
        SelectArrow: {
          style: {
            color: theme.colors.contentSecondary,
            width: '18px',
            height: '18px',
          },
        },
        Dropdown: {
          style: {
            borderRadius: '10px',
            border: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            backgroundColor: theme.colors.backgroundPrimary,
          },
        },
        ...overrides,
      }}
      {...rest}
    />
  );
}
