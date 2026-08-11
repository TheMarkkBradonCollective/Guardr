-- Raise default staff revenue-share from ~18% of platform fees to ~50%.
-- Preserves relative role weights; bumps period caps so the higher shares are not clipped early.
-- Applies to existing platform_settings rows (column default alone does not rewrite stored JSON).

ALTER TABLE platform_settings
  ALTER COLUMN staff_compensation_config SET DEFAULT '{
    "enabled": true,
    "cadence": "weekly",
    "roleRules": {
      "Support": { "percentOfFees": 0.0417, "floorPerPeriod": 0, "capPerPeriod": 1100, "hourlyPayRate": 18 },
      "Moderator": { "percentOfFees": 0.0556, "floorPerPeriod": 0, "capPerPeriod": 1700, "hourlyPayRate": 20 },
      "Administrator": { "percentOfFees": 0.0694, "floorPerPeriod": 0, "capPerPeriod": 2200, "hourlyPayRate": 22 },
      "Manager": { "percentOfFees": 0.0833, "floorPerPeriod": 0, "capPerPeriod": 3300, "hourlyPayRate": 28 },
      "Director": { "percentOfFees": 0.1111, "floorPerPeriod": 0, "capPerPeriod": 5600, "hourlyPayRate": 35 },
      "Founder": { "percentOfFees": 0.1389, "floorPerPeriod": 0, "capPerPeriod": 8300, "hourlyPayRate": 40 }
    }
  }'::jsonb;

UPDATE platform_settings
SET staff_compensation_config = '{
  "enabled": true,
  "cadence": "weekly",
  "roleRules": {
    "Support": { "percentOfFees": 0.0417, "floorPerPeriod": 0, "capPerPeriod": 1100, "hourlyPayRate": 18 },
    "Moderator": { "percentOfFees": 0.0556, "floorPerPeriod": 0, "capPerPeriod": 1700, "hourlyPayRate": 20 },
    "Administrator": { "percentOfFees": 0.0694, "floorPerPeriod": 0, "capPerPeriod": 2200, "hourlyPayRate": 22 },
    "Manager": { "percentOfFees": 0.0833, "floorPerPeriod": 0, "capPerPeriod": 3300, "hourlyPayRate": 28 },
    "Director": { "percentOfFees": 0.1111, "floorPerPeriod": 0, "capPerPeriod": 5600, "hourlyPayRate": 35 },
    "Founder": { "percentOfFees": 0.1389, "floorPerPeriod": 0, "capPerPeriod": 8300, "hourlyPayRate": 40 }
  }
}'::jsonb
WHERE
  -- Only rewrite stock 18% defaults (or missing rules). Custom Director/Founder edits are left alone.
  COALESCE((staff_compensation_config -> 'roleRules' -> 'Support' ->> 'percentOfFees')::numeric, 0.015) = 0.015
  AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Moderator' ->> 'percentOfFees')::numeric, 0.02) = 0.02
  AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Administrator' ->> 'percentOfFees')::numeric, 0.025) = 0.025
  AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Manager' ->> 'percentOfFees')::numeric, 0.03) = 0.03
  AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Director' ->> 'percentOfFees')::numeric, 0.04) = 0.04
  AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Founder' ->> 'percentOfFees')::numeric, 0.05) = 0.05;

COMMENT ON COLUMN platform_settings.staff_compensation_config IS
  'Staff revenue-share compensation — ~50% of collected platform fees across roles, caps/floors, cadence, hourlyPayRate for Prop 22 add-ons.';
