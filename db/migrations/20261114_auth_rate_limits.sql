-- Guardr: shared login throttle (security round 5)
-- Additive only. One row per (hashed email or IP, one-minute window); old windows are pruned by the Worker.
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_window_start ON public.auth_rate_limits (window_start);

COMMENT ON TABLE public.auth_rate_limits IS
  'Login attempt counters per SHA-256(email) / SHA-256(ip) per minute; shared across Worker instances.';
