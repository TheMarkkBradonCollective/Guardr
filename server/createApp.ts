import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { isAllowedApiOrigin, applyApiCors } from '../api/_push/apiCors';
import { registerCronRoutes } from './cronRoutes';
import { registerPushRoutes } from './pushRoutes';
import { registerStripeRoutes, registerStripeWebhook } from './stripe';
import { rateLimitMiddleware } from './rateLimitMiddleware';

/** Express app with API routes only (Stripe, health). Used by Vercel serverless and local server. */
export function createApiApp(): Express {
  const app = express();

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && isAllowedApiOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(204).end();
    }
    return next();
  });

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
