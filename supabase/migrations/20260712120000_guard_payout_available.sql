ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS guard_payout_available BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS guard_payout_available_at TIMESTAMPTZ;

-- Completed jobs with client funds secured should already be collectible by guards
UPDATE security_requests
SET
  guard_payout_available = TRUE,
  guard_payout_available_at = COALESCE(guard_payout_available_at, NOW())
WHERE status = 'completed'
  AND payment_status IN ('paid', 'held')
  AND COALESCE(guard_payout_method, '') <> 'cash'
  AND payment_status <> 'released';
