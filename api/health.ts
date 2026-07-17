import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    status: 'ok',
    version: process.env.VITE_APP_VERSION || process.env.npm_package_version || 'unknown',
  });
}
