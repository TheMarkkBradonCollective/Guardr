ALTER TABLE certifications
  ADD COLUMN IF NOT EXISTS catalog_id TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT;

CREATE INDEX IF NOT EXISTS idx_certifications_catalog_id ON certifications(catalog_id);
CREATE INDEX IF NOT EXISTS idx_certifications_category ON certifications(category);
