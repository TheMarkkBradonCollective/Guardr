import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { handlePushTest } = await import('../pushRuntime');
    return await handlePushTest(req, res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push test failed to start';
    console.error('Push test bootstrap error:', message, err);
    return res.status(500).json({ error: message });
  }
}
