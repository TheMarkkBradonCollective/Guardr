import type { Hono } from 'hono';
import type { WorkerEnv } from '../app.ts';
import { signJwtWeb } from '../../lib/auth/jwt.ts';
import { hashPassword, verifyPasswordHash, isPasswordHash } from '../../src/lib/auth/passwordHash.ts';
import { verifyAccountPassword } from '../../src/lib/accountPasswords.ts';
import { createNeonDatabase } from '../../lib/db/neonServerless.ts';
import { resolvePlatformRole } from '../../lib/accountSessionAuth.ts';
import { currentRequestIdentity } from '../../lib/auth/requestIdentity.ts';
import { buildSignupProfileRow, EMAIL_RE, SAFE_ID_RE, type SignupBody } from '../security/signupProfile.ts';

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

  /**
   * Public sign-up. Creates a NEW guard or client profile plus its login on the
   * server, storing only a PBKDF2 hash. Staff accounts cannot be self-created, and
   * a caller can never attach a login to an existing profile.
   */
  app.post('/api/auth/signup', async (c) => {
    const body = (await c.req.json<SignupBody>().catch(() => ({}))) as SignupBody;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const profileKind = body.profileKind;
    if (!email || !password || !profileKind) {
      return c.json({ error: 'Missing signup fields' }, 400);
    }
    if (!EMAIL_RE.test(email)) return c.json({ error: 'Enter a valid email address' }, 400);
    if (password.length < 8) return c.json({ error: 'Password must be at least 8 characters' }, 400);
    if (profileKind !== 'guard' && profileKind !== 'client') {
      return c.json({ error: 'Staff accounts are created by a Director in the Staff app' }, 403);
    }

    const db = createNeonDatabase(c.env.DATABASE_URL);
    const table = profileKind === 'client' ? 'clients' : 'guards';

    const existingUser = await db.from('users').select('id').eq('email', email).maybeSingle();
    if (existingUser.error) return c.json({ error: 'Sign-up is temporarily unavailable' }, 500);
    if (existingUser.data) return c.json({ error: 'Email already registered' }, 409);
    for (const t of ['guards', 'clients', 'staff']) {
      const taken = await db.from(t).select('id').eq('email', email).maybeSingle();
      if (taken.data) return c.json({ error: 'Email already registered' }, 409);
    }

    const row = buildSignupProfileRow(profileKind, body.profile);
    const requestedId = typeof body.profile?.id === 'string' ? body.profile.id : '';
    const profileId = SAFE_ID_RE.test(requestedId) ? requestedId : `${profileKind}-${crypto.randomUUID()}`;
    const passwordHash = await hashPassword(password);
    row.id = profileId;
    row.email = email;
    row.password_hash = passwordHash;
    row.password = null;
    row.must_change_password = false;

    // Plain INSERT: fails if the id already exists, so no one can take over a profile.
    const inserted = await db.from(table).insert(row);
    if (inserted.error) {
      console.error('signup profile insert failed', inserted.error.message);
      if (/not-null|violates check|invalid input/i.test(inserted.error.message)) {
        return c.json({ error: 'Some required sign-up details are missing. Please complete the form.' }, 400);
      }
      return c.json({ error: 'Could not create account. This email may already be registered.' }, 409);
    }
    const userInsert = await db.from('users').insert({
      email,
      password_hash: passwordHash,
      profile_kind: profileKind,
      profile_id: profileId,
    });
    if (userInsert.error) {
      await db.from(table).delete().eq('id', profileId);
      console.error('signup user insert failed', userInsert.error.message);
      return c.json({ error: 'Could not create account. This email may already be registered.' }, 409);
    }

    const platformRole = profileKind === 'client' ? 'client' : 'guard';
    const token = await signJwtWeb(
      { sub: profileId, email, role: platformRole, profileKind, profileId },
      c.env.JWT_SECRET
    );
    return c.json({ token, user: { id: profileId, email, role: platformRole, name: row.name ?? null } }, 201);
  });

  /** Change the signed-in account's password (updates the login hash; clears any plaintext). */
  app.post('/api/auth/change-password', async (c) => {
    const identity = currentRequestIdentity();
    if (!identity) return c.json({ error: 'Sign in required' }, 401);
    const body = (await c.req.json<{ newPassword?: string }>().catch(() => ({}))) as { newPassword?: string };
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
    if (newPassword.length < 8) return c.json({ error: 'Password must be at least 8 characters' }, 400);
    const db = createNeonDatabase(c.env.DATABASE_URL);
    const passwordHash = await hashPassword(newPassword);
    const updated = await db
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('profile_id', identity.profileId)
      .eq('profile_kind', identity.profileKind);
    if (updated.error || !(updated.data ?? []).length) {
      return c.json({ error: 'Could not update password' }, 500);
    }
    const table = identity.profileKind === 'staff' ? 'staff' : identity.profileKind === 'client' ? 'clients' : 'guards';
    await db
      .from(table)
      .update({ password_hash: passwordHash, password: null, must_change_password: false })
      .eq('id', identity.profileId);
    return c.json({ ok: true });
  });

  app.get('/api/auth/me', async (c) => {
    const identity = currentRequestIdentity();
    if (!identity) return c.json({ user: null }, 401);
    return c.json({
      user: { id: identity.profileId, email: identity.email, role: identity.platformRole },
    });
  });

  app.post('/api/auth/logout', (c) => c.json({ ok: true }));

  app.get('/api/auth/session', async (c) => {
    const identity = currentRequestIdentity();
    const token = readBearer(c.req.header('authorization'));
    if (!identity || !token) return c.json({ session: null });
    return c.json({
      session: {
        access_token: token,
        user: { id: identity.profileId, email: identity.email, role: identity.platformRole },
      },
    });
  });
}
