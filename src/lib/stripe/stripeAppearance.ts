import type { Appearance } from '@stripe/stripe-js';
import { readThemeFromDocument } from '../platform/theme';

/** Stripe Payment Element appearance aligned with Guardr chrome (light + dark). */
export function guardrStripeAppearance(mode = readThemeFromDocument()): Appearance {
  const dark = mode === 'dark';
  return {
    theme: dark ? 'night' : 'stripe',
    variables: {
      colorPrimary: dark ? '#e8c547' : '#1a1a1a',
      colorBackground: dark ? '#12141a' : '#ffffff',
      colorText: dark ? '#f4f4f5' : '#171717',
      colorDanger: '#ef4444',
      fontFamily: '"Inter Variable", Inter, system-ui, sans-serif',
      borderRadius: '10px',
      spacingUnit: '4px',
    },
    rules: {
      '.Input': {
        border: dark ? '1px solid #2e3340' : '1px solid #e4e4e7',
        boxShadow: 'none',
      },
      '.Tab': {
        border: dark ? '1px solid #2e3340' : '1px solid #e4e4e7',
      },
      '.Label': {
        fontWeight: '500',
      },
    },
  };
}
