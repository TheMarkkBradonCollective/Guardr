/// <reference types="@cloudflare/workers-types" />

import { createWorkerApp, type WorkerEnv } from './app.ts';

const app = createWorkerApp();

function applyEnv(env: WorkerEnv): void {
  process.env.DATABASE_URL = env.DATABASE_URL;
  process.env.JWT_SECRET = env.JWT_SECRET;
  if (env.STRIPE_SECRET_KEY) process.env.STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
  if (env.STRIPE_WEBHOOK_SECRET) process.env.STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;
  if (env.VAPID_PUBLIC_KEY) process.env.VAPID_PUBLIC_KEY = env.VAPID_PUBLIC_KEY;
  if (env.VAPID_PRIVATE_KEY) process.env.VAPID_PRIVATE_KEY = env.VAPID_PRIVATE_KEY;
  if (env.CRON_SECRET) process.env.CRON_SECRET = env.CRON_SECRET;
}

async function runCron(path: string, env: WorkerEnv): Promise<void> {
  applyEnv(env);
  const secret = env.CRON_SECRET ?? '';
  const request = new Request(`https://guardr.internal${path}`, {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
  await app.fetch(request, env);
}

export default {
  async fetch(request: Request, env: WorkerEnv, _ctx: ExecutionContext): Promise<Response> {
    applyEnv(env);
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return app.fetch(request, env);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    const spaRequest = new Request(new URL('/index.html', url.origin), request);
    return env.ASSETS.fetch(spaRequest);
  },

  async scheduled(event: ScheduledEvent, env: WorkerEnv, _ctx: ExecutionContext): Promise<void> {
    if (event.cron === '*/5 * * * *') {
      await runCron('/api/cron/missed-checkins', env);
      await runCron('/api/cron/pre-shift-briefings', env);
      return;
    }
    if (event.cron === '0 14 * * *') {
      await runCron('/api/cron/company-placard-expiry', env);
    }
  },
};
