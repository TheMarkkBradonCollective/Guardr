import { getSupabaseAdmin } from '../../../../db/adminClient.ts';
import type { VercelRequest, VercelResponse } from '../../../types.ts';
import { getStripe, getStripeForMode } from '../../../../stripeClient.ts';
import { PAYMENTS_NOT_CONFIGURED_BODY } from '../../../../stripeEnv.ts';
import { requestIsDirectorTier } from '../../../readPlatformRole.ts';
import { isClientPaymentIntentKind } from '../../../../stripe/clientPaymentKinds.ts';
import { createClientPaymentIntent } from '../../../../stripe/createClientPaymentIntent.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body ?? {}) as {
    kind?: string;
    jobId?: string;
    clientEmail?: string;
    jobTitle?: string;
    amountCents?: number;
    testMode?: boolean;
  };

  const testMode = body.testMode === true;
  if (testMode) {
    const allowed = await requestIsDirectorTier(req);
    if (!allowed) {
      return res.status(403).json({ error: 'Test-mode payments are limited to Director and above' });
    }
  }

  const stripe = testMode ? await getStripeForMode('test') : await getStripe();
  if (!stripe) {
    return res.status(503).json(PAYMENTS_NOT_CONFIGURED_BODY);
  }

  if (!isClientPaymentIntentKind(body.kind)) {
    return res.status(400).json({ error: 'kind must be job_payment, overtime, schedule_change, or tip' });
  }

  try {
    const db = await getSupabaseAdmin();
    const result = await createClientPaymentIntent(stripe, db, {
      kind: body.kind,
      jobId: body.jobId ?? '',
      clientEmail: body.clientEmail ?? '',
      jobTitle: body.jobTitle,
      amountCents: body.amountCents ?? 0,
    });
    if (result.ok === false) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(200).json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create payment intent';
    console.error('Payment intent error:', message);
    return res.status(500).json({ error: message });
  }
}
