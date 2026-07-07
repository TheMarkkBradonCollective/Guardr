import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit, rateLimitKey, DEFAULT_RATE_LIMIT } from '../lib/rateLimit';

export function rateLimitMiddleware(windowMs = DEFAULT_RATE_LIMIT.windowMs, maxRequests = DEFAULT_RATE_LIMIT.maxRequests) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const key = rateLimitKey(ip, req.path);
    const result = checkRateLimit(key, { windowMs, maxRequests });

    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    if (!result.allowed) {
      res.setHeader('Retry-After', String(Math.ceil(result.retryAfterMs / 1000)));
      res.status(429).json({ error: 'Too many requests' });
      return;
    }
    next();
  };
}
