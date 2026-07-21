/**
 * GuardrSegmented — Base Web SegmentedControl wrapper.
 * https://baseweb.design/components/segmented-control/
 *
 * Active segment: black fill + white label in light mode; inverted in dark mode.
 * Soft highlight (no hard border) so edge segments are never clipped.
 */

import React from 'react';
import { SegmentedControl, Segment } from './baseuiShims';
import { useStyletron } from 'baseui';

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  description?: string;
}

interface GuardrSegmentedProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  fill?: boolean;
}

export function GuardrSegmented<T extends string = string>({
  options,
  value,
  onChange,
  fill = true,
}: GuardrSegmentedProps<T>) {
  const [, theme] = useStyletron();

  return (
    <SegmentedControl
      activeKey={value}
      onChange={({ activeKey }: { activeKey: React.Key }) => onChange(activeKey as T)}
      overrides={{
        Root: {
          style: {
            backgroundColor: theme.colors.backgroundSecondary,
            borderRadius: '999px',
            padding: '4px',
            width: fill ? '100%' : undefined,
            maxWidth: '100%',
            boxSizing: 'border-box',
            gap: '0',
            overflow: 'hidden',
          },
        },
        SegmentList: {
          style: {
            overflow: 'hidden',
            minWidth: 0,
            width: '100%',
          },
        },
        Active: {
          style: {
            borderWidth: 0,
            borderStyle: 'none',
            borderColor: 'transparent',
            borderRadius: '999px',
            // Light: black pill; dark: white pill (contentPrimary flips with theme).
            backgroundColor: theme.colors.contentPrimary,
            boxShadow: 'none',
          },
        },
      }}
    >
      {options.map((opt) => (
        <Segment
          key={opt.id}
          label={opt.label}
          description={opt.description}
          overrides={{
            Tab: {
              style: ({ $isActive }: { $isActive?: boolean }) => ({
                borderRadius: '999px',
                fontWeight: $isActive ? 700 : 500,
                fontSize: '14px',
                // Light: white on black active pill; dark: black on white (inverse primary).
                color: $isActive
                  ? theme.colors.contentInversePrimary
                  : theme.colors.contentSecondary,
                backgroundColor: 'transparent',
                boxShadow: 'none',
                border: 'none',
                outline: 'none',
                outlineOffset: '0',
                paddingTop: '10px',
                paddingBottom: '10px',
                paddingLeft: '12px',
                paddingRight: '12px',
                flex: fill ? 1 : undefined,
                minWidth: 0,
                justifyContent: fill ? 'center' : 'flex-start',
                transition: 'color 120ms ease',
                minHeight: '40px',
              }),
            },
          }}
        />
      ))}
    </SegmentedControl>
  );
}
