import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  PRE_WIPE_BACKUP_BRANCH_ID,
  PRODUCTION_BRANCH_ID,
  assertQaSeedTarget,
} from './qa-seed-guard.ts';

const QA_URL = 'postgresql://owner:secret@ep-qa-example.c-4.us-west-2.aws.neon.tech/guardr?sslmode=require';

describe('QA seed target guard', () => {
  it('allows a direct Neon URL on a non-production branch when confirmed', () => {
    assert.doesNotThrow(() =>
      assertQaSeedTarget({
        connectionString: QA_URL,
        branchId: 'br-jolly-violet-ar4qkh46',
        confirm: 'qa-e2e',
      })
    );
  });

  it('refuses the production branch even when confirm is set', () => {
    assert.throws(
      () =>
        assertQaSeedTarget({
          connectionString:
            'postgresql://owner:secret@ep-morning-mountain-ar65xg3s.c-4.us-west-2.aws.neon.tech/guardr',
          branchId: PRODUCTION_BRANCH_ID,
          confirm: 'qa-e2e',
        }),
      /Refusing to seed/
    );
  });

  it('refuses the pre-wipe backup endpoint', () => {
    assert.throws(
      () =>
        assertQaSeedTarget({
          connectionString:
            'postgresql://owner:secret@ep-lingering-violet-arxzhvri.c-4.us-west-2.aws.neon.tech/guardr',
          branchId: PRE_WIPE_BACKUP_BRANCH_ID,
          confirm: 'qa-e2e',
        }),
      /pre-wipe backup|Refusing to seed/
    );
  });

  it('refuses a pooled connection and a missing confirm', () => {
    assert.throws(
      () =>
        assertQaSeedTarget({
          connectionString:
            'postgresql://owner:secret@ep-qa-example-pooler.c-4.us-west-2.aws.neon.tech/guardr',
          branchId: 'br-jolly-violet-ar4qkh46',
          confirm: 'qa-e2e',
        }),
      /pooler/
    );
    assert.throws(
      () =>
        assertQaSeedTarget({
          connectionString: QA_URL,
          branchId: 'br-jolly-violet-ar4qkh46',
          confirm: undefined,
        }),
      /GUARDR_QA_SEED_CONFIRM/
    );
  });
});
