/**
 * Seed signed-in QA accounts on a non-production Neon branch.
 *
 * Uses the existing Worker auth tables (`users` + profile password_hash).
 * Does not create a new auth system and does not write to production.
 *
 *   GUARDR_QA_SEED_CONFIRM=qa-e2e \
 *   NEON_DATABASE_URL_UNPOOLED='postgresql://.../guardr?sslmode=require' \
 *   npm run db:seed:qa
 *
 * Password: QA_SEED_PASSWORD, or the default in scripts/qa-accounts.ts.
 * The URL must be the direct (unpooled) connection for the QA branch.
 *
 * Staff rows get non-resolving id_* URL placeholders so the existing activation
 * check can leave the onboarding gate. No ID images, Stripe accounts, jobs, or
 * messages are created.
 */
import pg from 'pg';
import { CURRENT_LEGAL_VERSIONS, requiredLegalDocumentsForRole } from '../src/lib/legalContent.ts';
import { hashPassword } from '../src/lib/auth/passwordHash.ts';
import { redactSecrets, resolveMigrationConnectionString, sslForConnection } from '../lib/db/databaseUrl.ts';
import { QA_ACCOUNTS, qaSeedPassword, type QaAccount } from './qa-accounts.ts';
import { assertQaSeedTarget } from './qa-seed-guard.ts';

function legalRole(account: QaAccount): 'guard' | 'client' | 'staff' {
  if (account.kind === 'client') return 'client';
  if (account.kind === 'staff') return 'staff';
  return 'guard';
}

async function main(): Promise<void> {
  const connectionString = resolveMigrationConnectionString();
  if (!connectionString) {
    console.error('Set NEON_DATABASE_URL_UNPOOLED to the direct Neon connection string for the QA branch.');
    process.exitCode = 2;
    return;
  }

  const client = new pg.Client({
    connectionString,
    ssl: sslForConnection(connectionString),
  });
  await client.connect();

  try {
    const branch = await client.query(
      `SELECT current_setting('neon.branch_id', true) AS branch_id`
    );
    const branchIdRaw = (branch.rows[0] as { branch_id?: string | null } | undefined)?.branch_id;
    const branchId = typeof branchIdRaw === 'string' && branchIdRaw.trim() ? branchIdRaw.trim() : null;
    assertQaSeedTarget({
      connectionString,
      branchId,
      confirm: process.env.GUARDR_QA_SEED_CONFIRM,
    });

    const password = qaSeedPassword();
    const passwordHash = await hashPassword(password);

    await client.query('BEGIN');
    try {
      for (const account of QA_ACCOUNTS) {
        if (account.kind === 'guard') {
          await client.query(
            `INSERT INTO guards (
               id, name, first_name, last_name, email, badge_number, phone,
               user_status, password_hash, must_change_password, verified, background_checked
             ) VALUES ($1,$2,$3,$4,$5,$6,'', 'active', $7, false, true, true)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               first_name = EXCLUDED.first_name,
               last_name = EXCLUDED.last_name,
               email = EXCLUDED.email,
               badge_number = EXCLUDED.badge_number,
               user_status = 'active',
               password_hash = EXCLUDED.password_hash,
               must_change_password = false,
               verified = true,
               background_checked = true`,
            [
              account.id,
              account.name,
              account.firstName,
              account.lastName,
              account.email,
              account.badgeNumber,
              passwordHash,
            ]
          );
        } else if (account.kind === 'client') {
          await client.query(
            `INSERT INTO clients (
               id, name, first_name, last_name, email, company_name, phone,
               client_type, account_status, approved, password_hash, must_change_password
             ) VALUES ($1,$2,$3,$4,$5,$6,'', $7, 'active', true, $8, false)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               first_name = EXCLUDED.first_name,
               last_name = EXCLUDED.last_name,
               email = EXCLUDED.email,
               company_name = EXCLUDED.company_name,
               client_type = EXCLUDED.client_type,
               account_status = 'active',
               approved = true,
               password_hash = EXCLUDED.password_hash,
               must_change_password = false`,
            [
              account.id,
              account.name,
              account.firstName,
              account.lastName,
              account.email,
              account.companyName ?? '',
              account.clientType,
              passwordHash,
            ]
          );
        } else {
          await client.query(
            `INSERT INTO staff (
               id, name, first_name, last_name, email, badge_number, phone,
               staff_role, user_status, password_hash, must_change_password,
               id_verification_status, id_document_type, id_front_url, id_back_url, id_selfie_url
             ) VALUES (
               $1,$2,$3,$4,$5,$6,'', $7, 'active', $8, false,
               'verified', 'state_id', $9, $10, $11
             )
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               first_name = EXCLUDED.first_name,
               last_name = EXCLUDED.last_name,
               email = EXCLUDED.email,
               badge_number = EXCLUDED.badge_number,
               staff_role = EXCLUDED.staff_role,
               user_status = 'active',
               password_hash = EXCLUDED.password_hash,
               must_change_password = false,
               id_verification_status = EXCLUDED.id_verification_status,
               id_document_type = EXCLUDED.id_document_type,
               id_front_url = EXCLUDED.id_front_url,
               id_back_url = EXCLUDED.id_back_url,
               id_selfie_url = EXCLUDED.id_selfie_url`,
            [
              account.id,
              account.name,
              account.firstName,
              account.lastName,
              account.email,
              account.badgeNumber,
              account.staffRole,
              passwordHash,
              `qa-placeholder://${account.id}/id-front`,
              `qa-placeholder://${account.id}/id-back`,
              `qa-placeholder://${account.id}/id-selfie`,
            ]
          );
        }

        await client.query(
          `INSERT INTO users (email, password_hash, profile_kind, profile_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (email) DO UPDATE SET
             password_hash = EXCLUDED.password_hash,
             profile_kind = EXCLUDED.profile_kind,
             profile_id = EXCLUDED.profile_id`,
          [account.email, passwordHash, account.kind, account.id]
        );

        const role = legalRole(account);
        for (const documentId of requiredLegalDocumentsForRole(role)) {
          await client.query(
            `INSERT INTO user_legal_acceptances (user_id, user_role, document_id, document_version)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, document_id, document_version) DO NOTHING`,
            [account.id, role, documentId, CURRENT_LEGAL_VERSIONS[documentId]]
          );
        }
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

    const passwordIsDefault = !process.env.QA_SEED_PASSWORD?.trim();
    console.log(
      JSON.stringify({
        ok: true,
        branchId,
        passwordIsDefault,
        accounts: QA_ACCOUNTS.map((account) => ({
          id: account.id,
          kind: account.kind,
          email: account.email,
          clientType: account.clientType ?? null,
          staffRole: account.staffRole ?? null,
          signInPath: account.signInPath,
        })),
      })
    );
  } finally {
    await client.end().catch(() => undefined);
  }
}

main().catch((err) => {
  console.error(redactSecrets(err instanceof Error ? err.message : 'QA seed failed'));
  process.exitCode = 1;
});
