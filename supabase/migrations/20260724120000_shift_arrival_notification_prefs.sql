-- Guard arrival, site departure, and job broadcast notification preferences

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS guard_arrived BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS guard_left_site BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS job_open_to_guards BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN notification_preferences.guard_arrived IS 'Staff/client alert when a guard arrives on site and marks themselves arrived';
COMMENT ON COLUMN notification_preferences.guard_left_site IS 'Staff/client/guard alert when a guard leaves the job site during an active shift';
COMMENT ON COLUMN notification_preferences.job_open_to_guards IS 'Guard broadcast when a paid job is opened on the marketplace map';
