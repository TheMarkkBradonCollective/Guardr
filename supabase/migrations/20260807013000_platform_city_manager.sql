ALTER TABLE platform_cities ADD COLUMN IF NOT EXISTS city_manager_id TEXT;

COMMENT ON COLUMN platform_cities.city_manager_id IS
  'Manager staff ID responsible for this city market; at most one manager per city';
