-- Staff can request a clearer credential photo with a note shown to the guard.

ALTER TABLE certifications
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
