/**
 * GuardrFormControl — Base Web FormControl wrapper.
 * https://baseweb.design/components/form-control/
 */

import React from 'react';
import { FormControl } from './baseuiShims';
import { useStyletron } from 'baseui';
import { FONT_TEXT } from '../../theme/typography';

interface GuardrFormControlProps {
  label?: React.ReactNode;
  caption?: React.ReactNode;
  error?: React.ReactNode;
  positive?: React.ReactNode;
  htmlFor?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function GuardrFormControl({
  label,
  caption,
  error,
  positive,
  htmlFor,
  disabled,
  children,
}: GuardrFormControlProps) {
  const [, theme] = useStyletron();

  return (
    <FormControl
      label={label}
      caption={error ?? caption}
      error={Boolean(error)}
      positive={Boolean(positive)}
      htmlFor={htmlFor}
      disabled={disabled}
      overrides={{
        Label: {
          style: {
            fontFamily: FONT_TEXT,
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: theme.colors.contentSecondary,
            marginBottom: '8px',
          },
        },
        Caption: {
          style: {
            fontSize: '12px',
            fontWeight: 500,
            color: error ? theme.colors.negative : theme.colors.contentSecondary,
            marginTop: '6px',
          },
        },
        ControlContainer: {
          style: {
            marginBottom: '16px',
          },
        },
      }}
    >
      {children}
    </FormControl>
  );
}
