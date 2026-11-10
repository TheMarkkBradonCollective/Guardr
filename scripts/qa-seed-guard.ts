import { classifyDatabaseUrl } from '../lib/db/databaseUrl.ts';

/** Live production branch. The seed must never write here. */
export const PRODUCTION_BRANCH_ID = 'br-divine-rain-arsnd6at';
/** Snapshot taken before the 2026-11-09 wipe. Leave it untouched. */
export const PRE_WIPE_BACKUP_BRANCH_ID = 'br-crimson-recipe-ar6aegox';

const FORBIDDEN_BRANCH_IDS = new Set([PRODUCTION_BRANCH_ID, PRE_WIPE_BACKUP_BRANCH_ID]);

/** Compute endpoints for the branches above. Host match is a second lock. */
const FORBIDDEN_ENDPOINT_IDS = ['ep-morning-mountain-ar65xg3s', 'ep-lingering-violet-arxzhvri'];

export const QA_SEED_CONFIRM_VALUE = 'qa-e2e';

export function assertQaSeedTarget(input: {
  connectionString: string;
  branchId: string | null;
  confirm: string | undefined;
}): void {
  if (input.confirm !== QA_SEED_CONFIRM_VALUE) {
    throw new Error(
      `Refusing to seed. Set GUARDR_QA_SEED_CONFIRM=${QA_SEED_CONFIRM_VALUE} to write QA accounts on a non-production Neon branch.`
    );
  }

  const target = classifyDatabaseUrl(input.connectionString);
  if (target.provider !== 'neon' || !target.host) {
    throw new Error('Refusing to seed: NEON_DATABASE_URL_UNPOOLED must be a Neon host.');
  }
  if (target.pooled) {
    throw new Error('Refusing to seed through the Neon pooler. Use the direct (unpooled) connection string.');
  }
  if (target.database !== 'guardr') {
    throw new Error('Refusing to seed: the database name must be guardr.');
  }

  const host = target.host;
  for (const endpointId of FORBIDDEN_ENDPOINT_IDS) {
    if (host === endpointId || host.startsWith(`${endpointId}.`) || host.startsWith(`${endpointId}-`)) {
      throw new Error(`Refusing to seed host ${endpointId}: that endpoint is production or the pre-wipe backup.`);
    }
  }

  const branchId = input.branchId?.trim() || '';
  if (!branchId) {
    throw new Error('Refusing to seed: Neon did not report a branch id.');
  }
  if (FORBIDDEN_BRANCH_IDS.has(branchId)) {
    throw new Error(`Refusing to seed Neon branch ${branchId}.`);
  }
}
