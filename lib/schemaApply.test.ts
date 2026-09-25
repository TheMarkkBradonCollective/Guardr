import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  PUSH_SUBSCRIPTIONS_APP_CHANNEL_SQL,
  isMissingAppChannelError,
  projectRefFromSupabaseUrl,
} from './schemaApply.ts';

describe('schemaApply', () => {
  it('exports idempotent DDL for push_subscriptions.app_channel', () => {
    assert.match(PUSH_SUBSCRIPTIONS_APP_CHANNEL_SQL, /ADD COLUMN IF NOT EXISTS app_channel/i);
    assert.match(PUSH_SUBSCRIPTIONS_APP_CHANNEL_SQL, /CHECK \(app_channel IN \('main', 'messenger'\)\)/);
    assert.match(PUSH_SUBSCRIPTIONS_APP_CHANNEL_SQL, /CREATE INDEX IF NOT EXISTS idx_push_subscriptions_app_channel/);
  });

  it('detects the production missing-column error', () => {
    assert.equal(
      isMissingAppChannelError(
        'column push_subscriptions.app_channel does not exist'
      ),
      true
    );
    assert.equal(isMissingAppChannelError('permission denied'), false);
  });

  it('parses the hosted project ref from the Supabase URL', () => {
    assert.equal(
      projectRefFromSupabaseUrl('https://opgzwurnjkrqkjujqokh.supabase.co'),
      'opgzwurnjkrqkjujqokh'
    );
    assert.equal(projectRefFromSupabaseUrl('not-a-url'), null);
  });
});
