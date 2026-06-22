-- Split display name into first / middle / last for profiles.

ALTER TABLE guards
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS middle_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS middle_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Backfill from existing name column where parts are empty.
UPDATE guards
SET
  first_name = COALESCE(NULLIF(trim(first_name), ''), split_part(trim(name), ' ', 1)),
  last_name = COALESCE(
    NULLIF(trim(last_name), ''),
    CASE
      WHEN array_length(regexp_split_to_array(trim(name), '\s+'), 1) >= 2
        THEN (regexp_split_to_array(trim(name), '\s+'))[array_length(regexp_split_to_array(trim(name), '\s+'), 1)]
      ELSE ''
    END
  ),
  middle_name = COALESCE(
    NULLIF(trim(middle_name), ''),
    CASE
      WHEN array_length(regexp_split_to_array(trim(name), '\s+'), 1) > 2
        THEN array_to_string(
          (regexp_split_to_array(trim(name), '\s+'))[2:array_length(regexp_split_to_array(trim(name), '\s+'), 1) - 1],
          ' '
        )
      ELSE NULL
    END
  )
WHERE trim(coalesce(name, '')) <> '';

UPDATE clients
SET
  first_name = COALESCE(NULLIF(trim(first_name), ''), split_part(trim(name), ' ', 1)),
  last_name = COALESCE(
    NULLIF(trim(last_name), ''),
    CASE
      WHEN array_length(regexp_split_to_array(trim(name), '\s+'), 1) >= 2
        THEN (regexp_split_to_array(trim(name), '\s+'))[array_length(regexp_split_to_array(trim(name), '\s+'), 1)]
      ELSE ''
    END
  ),
  middle_name = COALESCE(
    NULLIF(trim(middle_name), ''),
    CASE
      WHEN array_length(regexp_split_to_array(trim(name), '\s+'), 1) > 2
        THEN array_to_string(
          (regexp_split_to_array(trim(name), '\s+'))[2:array_length(regexp_split_to_array(trim(name), '\s+'), 1) - 1],
          ' '
        )
      ELSE NULL
    END
  )
WHERE trim(coalesce(name, '')) <> '';
