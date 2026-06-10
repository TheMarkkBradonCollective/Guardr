-- Guard-submitted payout invoices (cash pickup / bank transfer)

CREATE TABLE IF NOT EXISTS guard_payout_invoices (
    id TEXT PRIMARY KEY,
    guard_id TEXT NOT NULL,
    guard_name TEXT NOT NULL,
    guard_email TEXT NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('cash', 'stripe')),
    job_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    lines JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS guard_payout_invoices_guard_id_idx ON guard_payout_invoices(guard_id);
CREATE INDEX IF NOT EXISTS guard_payout_invoices_status_idx ON guard_payout_invoices(status);

ALTER TABLE guard_payout_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guard_payout_invoices_select" ON guard_payout_invoices FOR SELECT USING (true);
CREATE POLICY "guard_payout_invoices_insert" ON guard_payout_invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "guard_payout_invoices_update" ON guard_payout_invoices FOR UPDATE USING (true) WITH CHECK (true);
