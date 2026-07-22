/**
 * GuardrSwitch — Base Web Switch (toggle) wrapper.
 * https://baseweb.design/components/checkbox/ (STYLE_TYPE.toggle_round)
 *
 * When `label` is omitted, renders a compact icon-only toggle (no Base UI label
 * text). Prefer this for cards that already show their own title.
 */

import React from 'react';
import { Checkbox, STYLE_TYPE, LABEL_PLACEMENT } from 'baseui/checkbox';
import { useStyletron } from 'baseui';

interface GuardrSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Visible label beside the toggle. Omit for icon-only / already-labeled layouts. */
  label?: string;
  /** Screen-reader name when there is no visible label. */
  ariaLabel?: string;
  labelRight?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function GuardrSwitch({
  checked,
  onChange,
  label,
  ariaLabel,
  labelRight = true,
  disabled = false,
  size = 'md',
}: GuardrSwitchProps) {
  const [, theme] = useStyletron();
  const scale = size === 'sm' ? 0.8 : 1;
  const hasVisibleLabel = Boolean(label && label.trim());
  const accessibleName = ariaLabel || label || 'Toggle';

  if (!hasVisibleLabel) {
    const trackW = 46 * scale;
    const trackH = 26 * scale;
    const knob = 20 * scale;
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={accessibleName}
        disabled={disabled}
        className="guardr-switch-icon-only"
        onClick={() => {
          if (!disabled) onChange(!checked);
        }}
        style={{
          width: trackW,
          height: trackH,
          borderRadius: 999,
          border: 'none',
          padding: 0,
          flexShrink: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          background: checked ? theme.colors.contentPrimary : theme.colors.borderOpaque,
          position: 'relative',
          transition: 'background-color 150ms ease',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: (trackH - knob) / 2,
            left: checked ? trackW - knob - 2 : 2,
            width: knob,
            height: knob,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            transition: 'left 150ms ease',
          }}
        />
      </button>
    );
  }

  return (
    <Checkbox
      checked={checked}
      onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
      checkmarkType={STYLE_TYPE.toggle_round}
      labelPlacement={labelRight ? LABEL_PLACEMENT.right : LABEL_PLACEMENT.left}
      disabled={disabled}
      overrides={{
        Toggle: {
          style: ({ $checked }: { $checked?: boolean }) => ({
            backgroundColor: '#fff',
            width: `${20 * scale}px`,
            height: `${20 * scale}px`,
            transform: `translateX(${$checked ? `${22 * scale}px` : '2px'})`,
            transition: 'transform 150ms ease',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }),
        },
        ToggleTrack: {
          style: ({ $checked }: { $checked?: boolean }) => ({
            backgroundColor: $checked ? theme.colors.contentPrimary : theme.colors.borderOpaque,
            width: `${46 * scale}px`,
            height: `${26 * scale}px`,
            borderRadius: '999px',
            transition: 'background-color 150ms ease',
          }),
        },
        Label: {
          style: {
            fontSize: size === 'sm' ? '13px' : '15px',
            fontWeight: 500,
            color: disabled ? theme.colors.contentSecondary : theme.colors.contentPrimary,
            paddingLeft: labelRight ? theme.sizing.scale300 : 0,
            paddingRight: !labelRight ? theme.sizing.scale300 : 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
          },
        },
        Root: {
          style: {
            alignItems: 'center',
            flexShrink: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          },
        },
      }}
    >
      {label}
    </Checkbox>
  );
}
