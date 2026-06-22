-- Government ID expiration date on guard profiles.

ALTER TABLE guards
  ADD COLUMN IF NOT EXISTS id_expiry_date DATE;
