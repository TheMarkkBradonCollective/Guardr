import type { InputOverrides } from 'baseui/input';
import type { TextareaOverrides } from 'baseui/textarea';

export const fieldRootStyle = {
  borderRadius: '12px',
  borderWidth: '1px',
  borderColor: 'borderOpaque',
  backgroundColor: 'backgroundPrimary',
};

export const fieldInputStyle = {
  minHeight: 'var(--space-touch, 44px)',
  fontSize: '16px',
  backgroundColor: 'transparent',
  color: 'contentPrimary',
};

export function inputOverrides(className = ''): InputOverrides {
  return {
    Root: {
      props: { className: `app-input uber-input ${className}`.trim() },
      style: fieldRootStyle,
    },
    Input: {
      style: fieldInputStyle,
    },
    InputContainer: {
      style: { backgroundColor: 'transparent' },
    },
  };
}

export function textareaOverrides(className = ''): TextareaOverrides {
  return {
    Root: {
      props: { className: `app-input app-textarea uber-input ${className}`.trim() },
      style: fieldRootStyle,
    },
    Input: {
      style: {
        ...fieldInputStyle,
        minHeight: '5.5rem',
        resize: 'vertical' as const,
      },
    },
  };
}

export const fieldInputOverrides = inputOverrides();
export const fieldTextareaOverrides = textareaOverrides();

export const formControlOverrides = {
  Label: {
    style: {
      fontSize: '13px',
      fontWeight: 600,
      marginBottom: '6px',
      color: 'contentPrimary',
    },
  },
  Caption: {
    style: {
      fontSize: '12px',
      color: 'contentSecondary',
      marginTop: '6px',
    },
  },
};
