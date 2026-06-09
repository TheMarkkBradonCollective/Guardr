-- Each certificate/license number may only exist once across all guard profiles.
CREATE UNIQUE INDEX IF NOT EXISTS idx_certifications_unique_normalized_number
ON certifications (
  upper(regexp_replace(trim(number), '[^a-zA-Z0-9]', '', 'g'))
)
WHERE trim(number) <> '';
