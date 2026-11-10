import { verifyJwtWeb } from '../auth/jwt.ts';
import { isDirectorTierPlatformRole } from '../accountSessionAuth.ts';
import type { VercelRequest } from './types.ts';

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function readBearerToken(req: VercelRequest): string | null {
  const raw = headerValue(req.headers.authorization) ?? headerValue(req.headers.Authorization);
  if (!raw?.startsWith('Bearer ')) return null;
  return raw.slice('Bearer '.length).trim() || null;
}

export async function readRequestPlatformRole(req: VercelRequest): Promise<string | null> {
  const token = readBearerToken(req);
  const secret = process.env.JWT_SECRET?.trim();
  if (!token || !secret) return null;
  const payload = await verifyJwtWeb(token, secret);
  return payload?.role ?? null;
}

export async function requestIsDirectorTier(req: VercelRequest): Promise<boolean> {
  const role = await readRequestPlatformRole(req);
  return isDirectorTierPlatformRole(role);
}
