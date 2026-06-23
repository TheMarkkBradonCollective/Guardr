-- Staff operational push notification preferences

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS job_submitted BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS guard_application BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS guard_pending_approval BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS client_pending_approval BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS credential_pending BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payment_attention BOOLEAN NOT NULL DEFAULT true;
