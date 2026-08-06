-- Activation help support ticket dedup + system sender normalization
-- Run in Supabase SQL editor on existing databases after PR #914.

-- 1. Resolve duplicate open Activation help tickets (keep the earliest per guard).
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM support_tickets
  WHERE subject = 'Activation help'
    AND status <> 'resolved'
)
UPDATE support_tickets t
SET
  status = 'resolved',
  updated_at = timezone('utc', now())
FROM ranked r
WHERE t.id = r.id
  AND r.rn > 1;

-- 2. Normalize auto-created activation opener messages to Guardr Staff.
UPDATE support_messages m
SET
  sender_id = 'guardr-support',
  sender_name = 'Guardr Staff'
FROM support_tickets t
WHERE m.ticket_id = t.id
  AND t.subject = 'Activation help'
  AND t.status <> 'resolved'
  AND m.body ILIKE '%your application was approved%'
  AND (
    m.sender_id <> 'guardr-support'
    OR m.sender_name <> 'Guardr Staff'
  );

-- 3. Prevent future duplicate open Activation help tickets per guard.
CREATE UNIQUE INDEX IF NOT EXISTS idx_support_tickets_open_activation_help
  ON support_tickets (user_id)
  WHERE subject = 'Activation help' AND status <> 'resolved';
