-- Open-contract pricing: negotiated client–guard rates and per-agreement platform fees
ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS pricing_mode TEXT NOT NULL DEFAULT 'standard'
    CHECK (pricing_mode IN ('standard', 'open_contract'));

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS agreement_fee_config JSONB;

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS opening_price_offer JSONB;

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS price_negotiations JSONB NOT NULL DEFAULT '[]';

UPDATE security_requests
SET pricing_mode = 'standard'
WHERE pricing_mode IS NULL;

UPDATE security_requests
SET price_negotiations = '[]'::jsonb
WHERE price_negotiations IS NULL;
