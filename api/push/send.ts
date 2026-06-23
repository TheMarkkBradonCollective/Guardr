import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { handlePushSend } = await import('../pushRuntime');
    return await handlePushSend(req, res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push send failed to start';
    console.error('Push send bootstrap error:', message, err);
    return res.status(500).json({ error: message });
  }
}
