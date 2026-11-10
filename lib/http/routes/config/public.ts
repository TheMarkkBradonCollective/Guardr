import type { VercelRequest, VercelResponse } from '../../types.ts';
import { requestIsDirectorTier } from '../../readPlatformRole.ts';
import {
  isStripePaymentsConfigured,
  isStripeTestPaymentsConfigured,
  PAYMENTS_NOT_CONFIGURED_BODY,
  readStripeLivePublishableKey,
  readStripePublishableKey,
  readStripeTestPublishableKey,
} from '../../../stripeEnv.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isStripePaymentsConfigured()) {
    return res.status(503).json(PAYMENTS_NOT_CONFIGURED_BODY);
  }

  const liveOrLegacyPk = readStripeLivePublishableKey() ?? readStripePublishableKey() ?? null;
  const director = await requestIsDirectorTier(req);
  const testConfigured = isStripeTestPaymentsConfigured();

  return res.status(200).json({
    stripePublishableKey: liveOrLegacyPk,
    paymentsConfigured: true,
    canRunTestPayments: director && testConfigured,
    // Test publishable key is only returned to Director, Owner, and Founder.
    stripeTestPublishableKey: director && testConfigured ? readStripeTestPublishableKey() ?? null : null,
  });
}
