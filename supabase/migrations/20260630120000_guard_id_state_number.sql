-- Government ID issuing state and document number on guard profiles.

ALTER TABLE guards
  ADD COLUMN IF NOT EXISTS id_state TEXT,
  ADD COLUMN IF NOT EXISTS id_number TEXT;
