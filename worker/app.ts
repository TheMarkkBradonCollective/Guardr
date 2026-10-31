import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createVercelAdapter } from '../lib/worker/vercelAdapter.ts';
import { registerWorkerAuthRoutes } from './routes/auth.ts';
import { registerWorkerDataRoutes } from './routes/data.ts';
import { registerWorkerFileRoutes } from './routes/files.ts';
import { registerWorkerSyncRoutes } from './routes/sync.ts';
import healthHandler from '../lib/http/routes/health.ts';
import installRegister from '../lib/http/routes/install/register.ts';
import messagesClients from '../lib/http/routes/messages/clients.ts';
import messagesGuards from '../lib/http/routes/messages/guards.ts';
import messagesStaff from '../lib/http/routes/messages/staff.ts';
import applySchema from '../lib/http/routes/admin/apply-schema.ts';
import stripeWebhook from '../lib/http/routes/stripe/webhook.ts';
import stripeHealth from '../lib/http/routes/stripe/health.ts';
import paymentsHealth from '../lib/http/routes/payments/health.ts';
import integrationsHealth from '../lib/http/routes/integrations/health.ts';
import createStripeAccount from '../lib/http/routes/stripe/connect/create-account.ts';
import stripeAccountLink from '../lib/http/routes/stripe/connect/account-link.ts';
import stripeConnectStatus from '../lib/http/routes/stripe/connect/status/[accountId].ts';
import cashDeposit from '../lib/http/routes/stripe/checkout/cash-deposit.ts';
import createSession from '../lib/http/routes/stripe/checkout/create-session.ts';
import overtimeCharge from '../lib/http/routes/stripe/checkout/overtime-charge.ts';
import tipCharge from '../lib/http/routes/stripe/checkout/tip-charge.ts';
import scheduleChangeCharge from '../lib/http/routes/stripe/checkout/schedule-change-charge.ts';
import payoutRelease from '../lib/http/routes/stripe/payout/release.ts';
import paymentHold from '../lib/http/routes/stripe/payment/hold.ts';
import paymentRefund from '../lib/http/routes/stripe/payment/refund.ts';
import stripePayments from '../lib/http/routes/stripe/payments.ts';
import squareCreatePayment from '../lib/http/routes/square/checkout/create-payment.ts';
import pushVapid from '../lib/http/routes/_push/entries/vapid-public-key.ts';
import pushSubscribe from '../lib/http/routes/_push/entries/subscribe.ts';
import pushUnsubscribe from '../lib/http/routes/_push/entries/unsubscribe.ts';
import pushSend from '../lib/http/routes/_push/entries/send.ts';
import pushTest from '../lib/http/routes/_push/entries/test.ts';
import pushEvents from '../lib/http/routes/_push/entries/events.ts';
import cronMissed from '../lib/http/routes/_push/entries/missed-checkins.ts';
import cronPlacard from '../lib/http/routes/_push/entries/company-placard-expiry.ts';
import cronBriefings from '../lib/http/routes/_push/entries/pre-shift-briefings.ts';
import { describeNeonConfig } from '../lib/db/databaseUrl.ts';

export type WorkerEnv = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  CRON_SECRET?: string;
  FILES: R2Bucket;
  ASSETS: Fetcher;
};

export function createWorkerApp() {
  const app = new Hono<{ Bindings: WorkerEnv }>();

  app.use('/api/*', cors({ origin: (origin) => origin ?? '*', credentials: true }));

  app.get('/api/health', createVercelAdapter(healthHandler));
  app.all('/api/install/register', createVercelAdapter(installRegister));

  registerWorkerAuthRoutes(app);
  registerWorkerDataRoutes(app);
  registerWorkerFileRoutes(app);
  registerWorkerSyncRoutes(app);

  app.all('/api/messages/clients', createVercelAdapter(messagesClients));
  app.all('/api/messages/guards', createVercelAdapter(messagesGuards));
  app.all('/api/messages/staff', createVercelAdapter(messagesStaff));
  app.all('/api/admin/apply-schema', createVercelAdapter(applySchema));

  app.post('/api/stripe/webhook', createVercelAdapter(stripeWebhook));
  app.get('/api/stripe/health', createVercelAdapter(stripeHealth));
  app.get('/api/payments/health', createVercelAdapter(paymentsHealth));
  app.get('/api/integrations/health', createVercelAdapter(integrationsHealth));
  app.post('/api/stripe/connect/create-account', createVercelAdapter(createStripeAccount));
  app.post('/api/stripe/connect/account-link', createVercelAdapter(stripeAccountLink));
  app.get('/api/stripe/connect/status/:accountId', createVercelAdapter(stripeConnectStatus));
  app.post('/api/stripe/checkout/cash-deposit', createVercelAdapter(cashDeposit));
  app.post('/api/stripe/checkout/create-session', createVercelAdapter(createSession));
  app.post('/api/stripe/checkout/overtime-charge', createVercelAdapter(overtimeCharge));
  app.post('/api/stripe/checkout/tip-charge', createVercelAdapter(tipCharge));
  app.post('/api/stripe/checkout/schedule-change-charge', createVercelAdapter(scheduleChangeCharge));
  app.post('/api/stripe/payout/release', createVercelAdapter(payoutRelease));
  app.post('/api/stripe/payment/hold', createVercelAdapter(paymentHold));
  app.post('/api/stripe/payment/refund', createVercelAdapter(paymentRefund));
  app.get('/api/stripe/payments', createVercelAdapter(stripePayments));
  app.post('/api/square/checkout/create-payment', createVercelAdapter(squareCreatePayment));

  app.get('/api/push/vapid-public-key', createVercelAdapter(pushVapid));
  app.post('/api/push/subscribe', createVercelAdapter(pushSubscribe));
  app.post('/api/push/unsubscribe', createVercelAdapter(pushUnsubscribe));
  app.post('/api/push/send', createVercelAdapter(pushSend));
  app.post('/api/push/test', createVercelAdapter(pushTest));
  app.post('/api/push/events', createVercelAdapter(pushEvents));

  app.all('/api/cron/missed-checkins', createVercelAdapter(cronMissed));
  app.all('/api/cron/company-placard-expiry', createVercelAdapter(cronPlacard));
  app.all('/api/cron/pre-shift-briefings', createVercelAdapter(cronBriefings));

  app.get('/api/health/worker', (c) =>
    c.json({
      status: 'ok',
      neonDatabase: describeNeonConfig({ DATABASE_URL: c.env.DATABASE_URL }),
    })
  );

  return app;
}
