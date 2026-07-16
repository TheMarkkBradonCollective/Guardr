/** Card payment processors supported on the platform. */
export type CardPaymentProcessor = 'stripe' | 'square';

export interface ProcessorConnectionStatus {
  configured: boolean;
  publishableKey?: string | null;
  applicationId?: string | null;
  locationId?: string | null;
}

export interface PaymentProcessorHealth {
  stripe: ProcessorConnectionStatus;
  square: ProcessorConnectionStatus;
}

export const CARD_PROCESSOR_LABELS: Record<CardPaymentProcessor, string> = {
  stripe: 'Stripe',
  square: 'Square',
};

export function processorEnvHint(processor: CardPaymentProcessor): string {
  if (processor === 'stripe') {
    return 'Add STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY in env, then redeploy.';
  }
  return 'Add SQUARE_ACCESS_TOKEN, SQUARE_APPLICATION_ID, and SQUARE_LOCATION_ID in env, then redeploy.';
}
