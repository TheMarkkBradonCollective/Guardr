import type Stripe from 'stripe';

export async function verifyStripeWebhookEvent(
  stripe: Stripe,
  rawBody: Buffer | string,
  signature: string,
  webhookSecret: string | string[]
): Promise<Stripe.Event> {
  const { default: StripeSdk } = await import('stripe');
  const payload = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
  const secrets = (Array.isArray(webhookSecret) ? webhookSecret : [webhookSecret])
    .map((value) => value.trim())
    .filter(Boolean);
  if (secrets.length === 0) {
    throw new Error('Missing webhook secret');
  }
  let lastError: unknown;
  for (const secret of secrets) {
    try {
      return await stripe.webhooks.constructEventAsync(
        payload,
        signature,
        secret,
        undefined,
        StripeSdk.createSubtleCryptoProvider()
      );
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Invalid signature');
}
