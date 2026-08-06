-- Remove PPO-like crew coordination tables and columns.
-- Multi-guard jobs continue via independent job_guard_slots only.

DROP TABLE IF EXISTS team_chat_messages;
DROP TABLE IF EXISTS team_chat_threads;
DROP TABLE IF EXISTS guard_standing_crew_members;
DROP TABLE IF EXISTS guard_crew_join_requests;

DROP INDEX IF EXISTS idx_security_requests_team_code_unique;

ALTER TABLE security_requests
  DROP COLUMN IF EXISTS team_lead_id,
  DROP COLUMN IF EXISTS team_code,
  DROP COLUMN IF EXISTS crew_name,
  DROP COLUMN IF EXISTS crew_description;

ALTER TABLE guards
  DROP COLUMN IF EXISTS standing_crew_name,
  DROP COLUMN IF EXISTS standing_crew_description;

ALTER TABLE platform_settings
  DROP COLUMN IF EXISTS team_lead_bonus_per_guard_per_hour,
  DROP COLUMN IF EXISTS team_lead_bonus_client_share_percent,
  DROP COLUMN IF EXISTS team_lead_bonus_platform_share_percent;

ALTER TABLE notification_preferences
  DROP COLUMN IF EXISTS standing_crew_invite,
  DROP COLUMN IF EXISTS crew_lead_request,
  DROP COLUMN IF EXISTS team_chat_message;
