/**
 * GuardrSegmented — Base Web SegmentedControl wrapper.
 * https://baseweb.design/components/segmented-control/
 *
 * Uber pattern: pill-style, white active on gray track.
 * Active highlight uses no hard border so edge segments are never clipped.
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
            // Soft fill only — BaseUI's default primary border gets clipped on edge segments.
            borderWidth: 0,
            borderStyle: 'none',
            borderColor: 'transparent',
            borderRadius: '999px',
            backgroundColor: theme.colors.backgroundPrimary,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
