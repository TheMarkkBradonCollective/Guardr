import type Stripe from 'stripe';

export async function verifyStripeWebhookEvent(
  stripe: Stripe,
  rawBody: Buffer | string,
  signature: string,
  webhookSecret: string
): Promise<Stripe.Event> {
  const { default: StripeSdk } = await import('stripe');
  const payload = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
  return stripe.webhooks.constructEventAsync(
    payload,
    signature,
    webhookSecret,
    undefined,
    StripeSdk.createSubtleCryptoProvider()
  );
}
