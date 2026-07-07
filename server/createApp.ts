import express, { type Express } from 'express';
import { registerCronRoutes } from './cronRoutes';
import { registerPushRoutes } from './pushRoutes';
import { registerStripeRoutes, registerStripeWebhook } from './stripe';
import { rateLimitMiddleware } from './rateLimitMiddleware';

/** Express app with API routes only (Stripe, health). Used by Vercel serverless and local server. */
export function createApiApp(): Express {
  const app = express();

  // Webhook needs raw body — register before JSON parser
  registerStripeWebhook(app);

  app.use(rateLimitMiddleware());
  app.use(express.json());

  registerStripeRoutes(app);
  registerPushRoutes(app);
  registerCronRoutes(app);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder',
      hasSupabase: !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY)),
      hasPush: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
    });
  });

  return app;
}
