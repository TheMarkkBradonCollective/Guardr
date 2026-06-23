import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Vercel bundles api/push/* sibling imports poorly — load helpers from api root at runtime. */

export async function handlePushTest(req: VercelRequest, res: VercelResponse) {
  const { getSupabaseAdmin, isPushConfigured, jsonError, verifySession } = await import(
    './push/pushShared'
  );
  const { dispatchPushNotification } = await import('./push/pushDelivery');

  if (req.method !== 'POST') {
    return jsonError(res, 405, 'Method not allowed');
  }

  const db = await getSupabaseAdmin();
  if (!db) {
    return jsonError(res, 503, 'Database is not configured');
  }

  if (!isPushConfigured()) {
    return jsonError(
      res,
      503,
      'Web Push is not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY on the server.'
    );
  }

  const body = (req.body ?? {}) as { userId?: string; email?: string; role?: string; siteId?: string };
  const session = await verifySession(db, {
    userId: body.userId ?? '',
    email: body.email ?? '',
    role: body.role ?? '',
  });
  if (!session) {
    return jsonError(res, 401, 'Unauthorized — sign in again and retry');
  }

  const result = await dispatchPushNotification(db, {
    userId: session.userId,
    title: 'Guardr test alert',
    body: 'Push notifications are working. You will receive operational alerts here.',
    type: 'test',
    url: '/',
    siteId: body.siteId,
  });

  return res.status(200).json({ ok: true, ...result });
}

export async function handlePushEvents(req: VercelRequest, res: VercelResponse) {
  const { handlePushEvents: runEvents } = await import('./pushEventsImpl');
  return runEvents(req, res);
}

export async function handlePushUnsubscribe(req: VercelRequest, res: VercelResponse) {
  const { getSupabaseAdmin, jsonError, parseRequestBody, removePushSubscription, verifySession } =
    await import('./push/pushShared');

  if (req.method !== 'POST') {
    return jsonError(res, 405, 'Method not allowed');
  }

  const db = await getSupabaseAdmin();
  if (!db) {
    return jsonError(res, 503, 'Database is not configured');
  }

  const body = parseRequestBody(req) as {
    userId?: string;
    email?: string;
    role?: string;
    endpoint?: string;
  };

  const session = await verifySession(db, {
    userId: body.userId ?? '',
    email: body.email ?? '',
    role: body.role ?? '',
  });
  if (!session) {
    return jsonError(res, 401, 'Unauthorized — sign in again and retry');
  }

  await removePushSubscription(db, session.userId, body.endpoint);
  return res.status(200).json({ ok: true });
}

export async function handlePushSend(req: VercelRequest, res: VercelResponse) {
  const { getSupabaseAdmin, isInternalPushAuthorized, isPushConfigured, jsonError, parseRequestBody } =
    await import('./push/pushShared');
  const { dispatchPushNotification } = await import('./push/pushDelivery');

  if (req.method !== 'POST') {
    return jsonError(res, 405, 'Method not allowed');
  }

  if (!isInternalPushAuthorized(req.headers.authorization)) {
    return jsonError(res, 401, 'Unauthorized — internal push secret required');
  }

  const body = parseRequestBody(req) as {
    title?: string;
    body?: string;
    type?: string;
    userId?: string;
    role?: string;
    url?: string;
    siteId?: string;
    guardId?: string;
    requestId?: string;
    ticketId?: string;
    priority?: 'normal' | 'high';
    excludeUserId?: string;
  };
  if (!body.title || !body.body || !body.type) {
    return jsonError(res, 400, 'title, body, and type are required');
  }

  const db = await getSupabaseAdmin();
  if (!db) {
    return jsonError(res, 503, 'Database is not configured');
  }

  if (!isPushConfigured()) {
    return jsonError(res, 503, 'Web Push is not configured on the server');
  }

  const result = await dispatchPushNotification(db, body as import('./push/pushTypes').PushSendPayload);
  return res.status(200).json({ ok: true, ...result });
}

export async function handleMissedCheckins(req: VercelRequest, res: VercelResponse) {
  const { getSupabaseAdmin } = await import('./push/pushShared');
  const { scanAndNotifyMissedCheckins } = await import('./push/pushMissedCheckins');

  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized — cron secret required' });
  }

  const db = await getSupabaseAdmin();
  if (!db) {
    return res.status(503).json({ error: 'Database is not configured' });
  }

  const result = await scanAndNotifyMissedCheckins(db);
  return res.status(200).json({ ok: true, ...result });
}
