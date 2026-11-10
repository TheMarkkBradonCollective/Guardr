export const CLIENT_PAYMENT_INTENT_KINDS = [
  'job_payment',
  'overtime',
  'schedule_change',
  'tip',
] as const;

export type ClientPaymentIntentKind = (typeof CLIENT_PAYMENT_INTENT_KINDS)[number];

export function isClientPaymentIntentKind(value: unknown): value is ClientPaymentIntentKind {
  return typeof value === 'string' && (CLIENT_PAYMENT_INTENT_KINDS as readonly string[]).includes(value);
}
