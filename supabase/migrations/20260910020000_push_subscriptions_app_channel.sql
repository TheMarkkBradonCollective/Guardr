-- Production follow-up for Messenger vs Main App push routing.
-- Idempotent: safe to re-run on databases that already have the column.

ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS app_channel TEXT DEFAULT 'main';

UPDATE push_subscriptions
  SET app_channel = 'main'
  WHERE app_channel IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'push_subscriptions_app_channel_check'
  ) THEN
    ALTER TABLE push_subscriptions
      ADD CONSTRAINT push_subscriptions_app_channel_check
      CHECK (app_channel IN ('main', 'messenger'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_app_channel
  ON push_subscriptions (app_channel);
