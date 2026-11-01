import type { Hono } from 'hono';
import type { WorkerEnv } from '../app.ts';
import { verifyJwtWeb, signJwtWeb } from '../../lib/auth/jwt.ts';
import { hashPassword, verifyPasswordHash, isPasswordHash } from '../../src/lib/auth/passwordHash.ts';
import { verifyAccountPassword } from '../../src/lib/accountPasswords.ts';
import { createNeonDatabase } from '../../lib/db/neonServerless.ts';
import { resolvePlatformRole } from '../../lib/accountSessionAuth.ts';

function readBearer(header: string | undefined): string | null {
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

async function verifyStoredPassword(
  stored: string | null | undefined,
  storedHash: string | null | undefined,
  entered: string
): Promise<boolean> {
  if (storedHash && isPasswordHash(storedHash)) return verifyPasswordHash(storedHash, entered);
  return verifyAccountPassword(stored ?? null, entered);
}

export function registerWorkerAuthRoutes(app: Hono<{ Bindings: WorkerEnv }>) {
  app.post('/api/auth/login', async (c) => {
    const body = (await c.req.json<{ email?: string; password?: string; role?: string }>().catch(
      () => ({}) as { email?: string; password?: string; role?: string }
    )) as { email?: string; password?: string; role?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? '';
    if (!email || !password) return c.json({ error: 'Email and password required' }, 400);

    const db = createNeonDatabase(c.env.DATABASE_URL);
    const userRow = await db
      .from('users')
      .select('id, email, password_hash, profile_kind, profile_id')
      .eq('email', email)
      .maybeSingle();
    if (userRow.error || !userRow.data) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    const u = userRow.data as Record<string, unknown>;
    const ok = await verifyPasswordHash(String(u.password_hash), password);
    if (!ok) return c.json({ error: 'Invalid credentials' }, 401);

    const kind = String(u.profile_kind) as 'guard' | 'client' | 'staff';
    const profileId = String(u.profile_id);
    const profileTable = kind === 'staff' ? 'staff' : kind === 'client' ? 'clients' : 'guards';
    const profile = await db.from(profileTable).select('*').eq('id', profileId).maybeSingle();
    if (!profile.data) return c.json({ error: 'Profile missing' }, 401);

    const row = profile.data as Record<string, unknown>;
    const platformRole = resolvePlatformRole({
      isStaff: kind === 'staff' || row.is_staff === true,
      staffRole: row.staff_role as never,
      sideRole: row.side_role === 'Finance' ? 'Finance' : null,
      legacyRole: kind,
    });

    const token = await signJwtWeb(
      {
        sub: profileId,
        email,
        role: platformRole,
        profileKind: kind,
        profileId,
      },
      c.env.JWT_SECRET
    );

    return c.json({
      token,
      user: {
        id: profileId,
        email,
        role: platformRole,
        name: row.name,
      },
    });
  });

  app.post('/api/auth/signup', async (c) => {
    const body = (await c.req
      .json<{ email?: string; password?: string; profileKind?: string; profileId?: string }>()
      .catch(
        () => ({}) as { email?: string; password?: string; profileKind?: string; profileId?: string }
      )) as { email?: string; password?: string; profileKind?: string; profileId?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? '';
    const profileKind = body.profileKind;
    const profileId = body.profileId;
    if (!email || !password || !profileKind || !profileId) {
      return c.json({ error: 'Missing signup fields' }, 400);
    }
    if (!['guard', 'client', 'staff'].includes(profileKind)) {
      return c.json({ error: 'Invalid profile kind' }, 400);
    }

    const db = createNeonDatabase(c.env.DATABASE_URL);
    const passwordHash = await hashPassword(password);
    const table = profileKind === 'staff' ? 'staff' : profileKind === 'client' ? 'clients' : 'guards';

    const existing = await db.from('users').select('id').eq('email', email).maybeSingle();
    if (existing.data) return c.json({ error: 'Email already registered' }, 409);

    await db.from(table).update({ password_hash: passwordHash }).eq('id', profileId);
    await db.from('users').insert({
      email,
      password_hash: passwordHash,
      profile_kind: profileKind,
      profile_id: profileId,
    });

    const platformRole = resolvePlatformRole({ legacyRole: profileKind });
    const token = await signJwtWeb(
      {
        sub: profileId,
        email,
        role: platformRole,
        profileKind: profileKind as 'guard' | 'client' | 'staff',
        profileId,
      },
      c.env.JWT_SECRET
    );

    return c.json({ token }, 201);
  });

  app.get('/api/auth/me', async (c) => {
    const token = readBearer(c.req.header('authorization'));
    if (!token) return c.json({ user: null }, 401);
    const payload = await verifyJwtWeb(token, c.env.JWT_SECRET);
    if (!payload) return c.json({ user: null }, 401);
    return c.json({
      user: {
        id: payload.profileId,
        email: payload.email,
        role: payload.role,
      },
    });
  });

  app.post('/api/auth/logout', (c) => c.json({ ok: true }));

  app.get('/api/auth/session', async (c) => {
    const token = readBearer(c.req.header('authorization'));
    if (!token) return c.json({ session: null });
    const payload = await verifyJwtWeb(token, c.env.JWT_SECRET);
    if (!payload) return c.json({ session: null });
    return c.json({
      session: {
        access_token: token,
        user: { id: payload.profileId, email: payload.email },
      },
    });
  });
}
