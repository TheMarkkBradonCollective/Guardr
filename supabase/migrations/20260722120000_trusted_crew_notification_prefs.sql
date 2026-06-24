-- Trusted status, job re-list, and crew chat push notification preferences

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS guard_trusted_status BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS client_trusted_status BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS job_relisted BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS team_chat_message BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN notification_preferences.guard_trusted_status IS 'Guard alert when staff mark or remove trusted status';
COMMENT ON COLUMN notification_preferences.client_trusted_status IS 'Client alert when staff mark or remove trusted status';
COMMENT ON COLUMN notification_preferences.job_relisted IS 'Client alert when a coordinated crew is dissolved and the job returns to the marketplace';
COMMENT ON COLUMN notification_preferences.team_chat_message IS 'Crew chat messages for multi-guard coordinated jobs';
