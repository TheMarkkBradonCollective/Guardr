import type { VercelRequest, VercelResponse } from '../../types.ts';
import {
  isStripePaymentsConfigured,
  PAYMENTS_NOT_CONFIGURED_BODY,
  readStripePublishableKey,
} from '../../../stripeEnv.ts';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  if (!isStripePaymentsConfigured()) {
    return res.status(503).json(PAYMENTS_NOT_CONFIGURED_BODY);
  }
  return res.status(200).json({
    stripePublishableKey: readStripePublishableKey() ?? null,
    paymentsConfigured: true,
  });
}
