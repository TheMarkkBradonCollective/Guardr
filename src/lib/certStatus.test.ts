import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL,
  formatCredentialSlotStatusSummary,
} from './certStatus.ts';

describe('formatCredentialSlotStatusSummary', () => {
  it('uses not listed or on file instead of missing counts when nothing is on file', () => {
    assert.equal(
      formatCredentialSlotStatusSummary({ missing: 2, listed: 0, onFile: 0, expired: 0 }),
      CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL
    );
    assert.equal(
      formatCredentialSlotStatusSummary({ missing: 9, listed: 0, onFile: 0, expired: 0 }),
      CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL
    );
  });

  it('describes mixed slot states without the missing label', () => {
    assert.equal(
      formatCredentialSlotStatusSummary({ missing: 1, listed: 1, onFile: 0, expired: 0 }),
      'Not listed or on file · 1 listed'
    );
  });
});
