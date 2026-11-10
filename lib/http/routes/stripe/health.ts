import type { VercelRequest, VercelResponse } from '../../types.ts';
import { isStripePaymentsConfigured, readStripePublishableKey } from '../../../stripeEnv.ts';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const configured = isStripePaymentsConfigured();
  return res.status(200).json({
    configured,
    publishableKey: configured ? readStripePublishableKey() ?? null : null,
  });
}
