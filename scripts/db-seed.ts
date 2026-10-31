/**
 * Seed the Neon guardr database with a staff admin user.
 *
 *   DATABASE_URL=postgresql://.../guardr STAFF_ADMIN_EMAIL=... STAFF_ADMIN_PASSWORD=... npm run db:seed
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';
import { hashPassword } from '../src/lib/auth/passwordHash.ts';
import { resolveMigrationConnectionString, redactSecrets, sslForConnection } from '../lib/db/databaseUrl.ts';

const DEFAULT_EMAIL = 'admin@guardr.co';

async function main(): Promise<void> {
  const connectionString = resolveMigrationConnectionString();
  if (!connectionString) {
    console.error('Set NEON_DATABASE_URL_UNPOOLED or a direct DATABASE_URL for seeding.');
    process.exitCode = 2;
    return;
  }

  const email = (process.env.STAFF_ADMIN_EMAIL ?? DEFAULT_EMAIL).trim().toLowerCase();
  const password = process.env.STAFF_ADMIN_PASSWORD?.trim();
  if (!password) {
    console.error('Set STAFF_ADMIN_PASSWORD in the environment (never commit it).');
    process.exitCode = 2;
    return;
  }

  const staffId = process.env.STAFF_ADMIN_ID?.trim() || 'staff-admin-seed';
  const passwordHash = await hashPassword(password);

  const client = new pg.Client({
    connectionString,
    ssl: sslForConnection(connectionString),
  });
  await client.connect();

  try {
    const hasStaff = await client.query(`SELECT to_regclass('public.staff') AS rel`);
    if (!hasStaff.rows[0]?.rel) {
      console.log('Applying db/neon-schema.sql …');
      const schemaPath = resolve(process.cwd(), 'db/neon-schema.sql');
      await client.query(readFileSync(schemaPath, 'utf8'));
    }

    await client.query(
      `INSERT INTO staff (id, name, first_name, last_name, email, badge_number, staff_role, user_status, password_hash, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, false)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         staff_role = EXCLUDED.staff_role,
         user_status = 'active',
         password_hash = EXCLUDED.password_hash`,
      [staffId, 'Guardr Admin', 'Guardr', 'Admin', email, 'ADMIN-1', 'Administrator', passwordHash]
    );

    await client.query(
      `INSERT INTO users (email, password_hash, profile_kind, profile_id)
       VALUES ($1, $2, 'staff', $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, profile_id = EXCLUDED.profile_id`,
      [email, passwordHash, staffId]
    );

    console.log(JSON.stringify({ ok: true, staffId, email }));
  } finally {
    await client.end().catch(() => undefined);
  }
}

main().catch((err) => {
  console.error(redactSecrets(err instanceof Error ? err.message : 'Seed failed'));
  process.exitCode = 1;
});
