-- Raise default staff revenue-share from ~18% of platform fees to ~50%.
-- Role ladder: Support lowest; Mod↔Admin and Manager↔Director sit close;
-- higher responsibility gets a larger share. Caps bumped so shares are not clipped early.
-- Applies to existing platform_settings rows (column default alone does not rewrite stored JSON).

ALTER TABLE platform_settings
  ALTER COLUMN staff_compensation_config SET DEFAULT '{
    "enabled": true,
    "cadence": "weekly",
    "roleRules": {
      "Support": { "percentOfFees": 0.04, "floorPerPeriod": 0, "capPerPeriod": 1100, "hourlyPayRate": 18 },
      "Moderator": { "percentOfFees": 0.06, "floorPerPeriod": 0, "capPerPeriod": 1700, "hourlyPayRate": 20 },
      "Administrator": { "percentOfFees": 0.07, "floorPerPeriod": 0, "capPerPeriod": 2200, "hourlyPayRate": 22 },
      "Manager": { "percentOfFees": 0.1, "floorPerPeriod": 0, "capPerPeriod": 3300, "hourlyPayRate": 28 },
      "Director": { "percentOfFees": 0.111, "floorPerPeriod": 0, "capPerPeriod": 5600, "hourlyPayRate": 35 },
      "Founder": { "percentOfFees": 0.119, "floorPerPeriod": 0, "capPerPeriod": 8300, "hourlyPayRate": 40 }
    }
  }'::jsonb;

UPDATE platform_settings
SET staff_compensation_config = '{
  "enabled": true,
  "cadence": "weekly",
  "roleRules": {
    "Support": { "percentOfFees": 0.04, "floorPerPeriod": 0, "capPerPeriod": 1100, "hourlyPayRate": 18 },
    "Moderator": { "percentOfFees": 0.06, "floorPerPeriod": 0, "capPerPeriod": 1700, "hourlyPayRate": 20 },
    "Administrator": { "percentOfFees": 0.07, "floorPerPeriod": 0, "capPerPeriod": 2200, "hourlyPayRate": 22 },
    "Manager": { "percentOfFees": 0.1, "floorPerPeriod": 0, "capPerPeriod": 3300, "hourlyPayRate": 28 },
    "Director": { "percentOfFees": 0.111, "floorPerPeriod": 0, "capPerPeriod": 5600, "hourlyPayRate": 35 },
    "Founder": { "percentOfFees": 0.119, "floorPerPeriod": 0, "capPerPeriod": 8300, "hourlyPayRate": 40 }
  }
}'::jsonb
WHERE
  -- Rewrite stock defaults only (legacy 18%, proportional 50%, or prior tight ladder). Custom edits left alone.
  (
    COALESCE((staff_compensation_config -> 'roleRules' -> 'Support' ->> 'percentOfFees')::numeric, 0.015) = 0.015
    AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Moderator' ->> 'percentOfFees')::numeric, 0.02) = 0.02
    AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Administrator' ->> 'percentOfFees')::numeric, 0.025) = 0.025
    AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Manager' ->> 'percentOfFees')::numeric, 0.03) = 0.03
    AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Director' ->> 'percentOfFees')::numeric, 0.04) = 0.04
    AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Founder' ->> 'percentOfFees')::numeric, 0.05) = 0.05
  )
  OR (
    COALESCE((staff_compensation_config -> 'roleRules' -> 'Support' ->> 'percentOfFees')::numeric, 0) = 0.0417
    AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Moderator' ->> 'percentOfFees')::numeric, 0) = 0.0556
    AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Administrator' ->> 'percentOfFees')::numeric, 0) = 0.0694
    AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Manager' ->> 'percentOfFees')::numeric, 0) = 0.0833
    AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Director' ->> 'percentOfFees')::numeric, 0) = 0.1111
    AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Founder' ->> 'percentOfFees')::numeric, 0) = 0.1389
  )
  OR (
    COALESCE((staff_compensation_config -> 'roleRules' -> 'Support' ->> 'percentOfFees')::numeric, 0) = 0.045
    AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Moderator' ->> 'percentOfFees')::numeric, 0) = 0.065
    AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Administrator' ->> 'percentOfFees')::numeric, 0) = 0.075
    AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Manager' ->> 'percentOfFees')::numeric, 0) = 0.095
    AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Director' ->> 'percentOfFees')::numeric, 0) = 0.105
    AND COALESCE((staff_compensation_config -> 'roleRules' -> 'Founder' ->> 'percentOfFees')::numeric, 0) = 0.115
  );

COMMENT ON COLUMN platform_settings.staff_compensation_config IS
  'Staff revenue-share compensation — ~50% of collected platform fees across roles (tight Mod/Admin & Manager/Director steps), caps/floors, cadence, hourlyPayRate for Prop 22 add-ons.';
