-- Stripe payment integration for Guardr

----------------------------------------------------
-- Guards: Stripe Connect Express account
----------------------------------------------------
ALTER TABLE guards ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;

----------------------------------------------------
-- Jobs: payment tracking
----------------------------------------------------
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid'
  CHECK (payment_status IN ('unpaid', 'paid', 'held', 'released'));

UPDATE security_requests SET payment_status = 'unpaid' WHERE payment_status IS NULL;

----------------------------------------------------
-- Payments ledger
----------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES security_requests(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'held', 'released', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_job_id ON payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session_id ON payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to payments" ON payments FOR ALL USING (true) WITH CHECK (true);
