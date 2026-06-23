ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS fee_config JSONB NOT NULL DEFAULT '{
    "model": "flat",
    "flatFeePerHour": 5,
    "percentRate": 0.15,
    "minFeePerHour": 4,
    "maxFeePerHour": 12,
    "tiers": [
      { "minHourlyRate": 75, "feePerHour": 10 },
      { "minHourlyRate": 50, "feePerHour": 8 },
      { "minHourlyRate": 30, "feePerHour": 6 },
      { "minHourlyRate": 0, "feePerHour": 5 }
    ]
  }'::jsonb;
