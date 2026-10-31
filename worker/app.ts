import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createVercelAdapter } from '../lib/worker/vercelAdapter.ts';
import { registerWorkerAuthRoutes } from './routes/auth.ts';
import { registerWorkerDataRoutes } from './routes/data.ts';
import { registerWorkerFileRoutes } from './routes/files.ts';
import { registerWorkerSyncRoutes } from './routes/sync.ts';
import healthHandler from '../api/health.ts';
import installRegister from '../api/install/register.ts';
import messagesClients from '../api/messages/clients.ts';
import messagesGuards from '../api/messages/guards.ts';
import messagesStaff from '../api/messages/staff.ts';
import authBridge from '../api/auth/bridge.ts';
import applySchema from '../api/admin/apply-schema.ts';
import stripeWebhook from '../api/stripe/webhook.ts';
import stripeHealth from '../api/stripe/health.ts';
import paymentsHealth from '../api/payments/health.ts';
import integrationsHealth from '../api/integrations/health.ts';
import createStripeAccount from '../api/stripe/connect/create-account.ts';
import stripeAccountLink from '../api/stripe/connect/account-link.ts';
import stripeConnectStatus from '../api/stripe/connect/status/[accountId].ts';
import cashDeposit from '../api/stripe/checkout/cash-deposit.ts';
import createSession from '../api/stripe/checkout/create-session.ts';
import overtimeCharge from '../api/stripe/checkout/overtime-charge.ts';
import tipCharge from '../api/stripe/checkout/tip-charge.ts';
import scheduleChangeCharge from '../api/stripe/checkout/schedule-change-charge.ts';
import payoutRelease from '../api/stripe/payout/release.ts';
import paymentHold from '../api/stripe/payment/hold.ts';
import paymentRefund from '../api/stripe/payment/refund.ts';
import stripePayments from '../api/stripe/payments.ts';
import squareCreatePayment from '../api/square/checkout/create-payment.ts';
import pushVapid from '../api/_push/entries/vapid-public-key.ts';
import pushSubscribe from '../api/_push/entries/subscribe.ts';
import pushUnsubscribe from '../api/_push/entries/unsubscribe.ts';
import pushSend from '../api/_push/entries/send.ts';
import pushTest from '../api/_push/entries/test.ts';
import pushEvents from '../api/_push/entries/events.ts';
import cronMissed from '../api/_push/entries/missed-checkins.ts';
import cronPlacard from '../api/_push/entries/company-placard-expiry.ts';
import cronBriefings from '../api/_push/entries/pre-shift-briefings.ts';
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
  app.all('/api/auth/bridge', createVercelAdapter(authBridge));
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
