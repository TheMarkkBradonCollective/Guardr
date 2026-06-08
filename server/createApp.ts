import express, { type Express } from 'express';
import { registerStripeRoutes } from './stripe';

/** Express app with API routes only (Stripe, health). Used by Vercel serverless and local server. */
export function createApiApp(): Express {
  const app = express();

  registerStripeRoutes(app);

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder',
      hasSupabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  });

  return app;
}
