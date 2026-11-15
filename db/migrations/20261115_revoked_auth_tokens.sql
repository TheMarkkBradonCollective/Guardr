-- Guardr: server-side sign-out (round 7)
-- Additive only. A signed-out token's SHA-256 is stored until the token would have expired;
-- the Worker refuses any request carrying a listed token. Expired rows are pruned by the Worker.
CREATE TABLE IF NOT EXISTS public.revoked_auth_tokens (
  token_hash TEXT PRIMARY KEY,
  profile_id TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revoked_auth_tokens_expires_at ON public.revoked_auth_tokens (expires_at);

COMMENT ON TABLE public.revoked_auth_tokens IS
  'SHA-256 of JWTs revoked by sign-out; rows can be deleted once expires_at has passed.';
