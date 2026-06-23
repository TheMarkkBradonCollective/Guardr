import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { handlePushEvents } = await import('../pushRuntime');
    return await handlePushEvents(req, res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push events failed to start';
    console.error('Push events bootstrap error:', message, err);
    return res.status(500).json({ error: message });
  }
}
