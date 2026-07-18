/**
 * GuardrSegmented — Base Web SegmentedControl wrapper.
 * https://baseweb.design/components/segmented-control/
 *
 * Uber pattern: pill-style, white active on gray track.
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
            padding: '3px',
            width: fill ? '100%' : undefined,
            gap: '0',
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
              style: ({ $active }: { $active?: boolean }) => ({
                borderRadius: '999px',
                fontWeight: $active ? 700 : 500,
                fontSize: '14px',
                color: $active ? theme.colors.contentPrimary : theme.colors.contentSecondary,
                backgroundColor: $active ? theme.colors.backgroundPrimary : 'transparent',
                boxShadow: $active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                border: 'none',
                outline: 'none',
                paddingTop: '10px',
                paddingBottom: '10px',
                paddingLeft: '16px',
                paddingRight: '16px',
                flex: fill ? 1 : undefined,
                justifyContent: fill ? 'center' : 'flex-start',
                transition: 'background-color 120ms ease, color 120ms ease',
                minHeight: '40px',
              }),
            },
          }}
        />
      ))}
    </SegmentedControl>
  );
}
