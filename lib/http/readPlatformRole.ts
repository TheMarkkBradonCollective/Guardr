import { isDirectorTierPlatformRole } from '../accountSessionAuth.ts';
import { currentRequestIdentity, readBearer } from '../auth/requestIdentity.ts';
import type { VercelRequest } from './types.ts';

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function readBearerToken(req: VercelRequest): string | null {
  return readBearer(headerValue(req.headers.authorization) ?? headerValue(req.headers.Authorization));
}

/** Platform role of the verified signed-in account (re-read from the database), or null. */
export async function readRequestPlatformRole(_req: VercelRequest): Promise<string | null> {
  return currentRequestIdentity()?.platformRole ?? null;
}

export async function requestIsDirectorTier(req: VercelRequest): Promise<boolean> {
  const role = await readRequestPlatformRole(req);
  return isDirectorTierPlatformRole(role);
}
