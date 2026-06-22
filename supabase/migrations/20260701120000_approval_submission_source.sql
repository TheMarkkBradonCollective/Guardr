-- Track who submitted items that appear in staff Approvals queues
ALTER TABLE guards
  ADD COLUMN IF NOT EXISTS id_submitted_by text;

ALTER TABLE certifications
  ADD COLUMN IF NOT EXISTS submitted_by_role text;
