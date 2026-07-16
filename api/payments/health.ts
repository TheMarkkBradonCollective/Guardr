import type { VercelRequest, VercelResponse } from '@vercel/node';

function stripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return !!key && key !== 'sk_test_placeholder';
}

function squareConfigured(): boolean {
  const token = process.env.SQUARE_ACCESS_TOKEN?.trim();
  const locationId = process.env.SQUARE_LOCATION_ID?.trim();
  return !!token && token !== 'sq0atp_placeholder' && !!locationId;
}

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    stripe: {
      configured: stripeConfigured(),
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    },
    square: {
      configured: squareConfigured(),
      applicationId: process.env.SQUARE_APPLICATION_ID || null,
      locationId: process.env.SQUARE_LOCATION_ID || null,
    },
  });
}
