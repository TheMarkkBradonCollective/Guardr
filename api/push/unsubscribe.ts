import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { handlePushUnsubscribe } = await import('../pushRuntime');
    return await handlePushUnsubscribe(req, res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push unsubscribe failed to start';
    console.error('Push unsubscribe bootstrap error:', message, err);
    return res.status(500).json({ error: message });
  }
}
