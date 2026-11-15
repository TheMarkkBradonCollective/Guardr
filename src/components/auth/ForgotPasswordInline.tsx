import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AppButton } from '../ui/AppButton';

/**
 * "Forgot password?" on the sign-in form. Sends a reset request to Guardr support (no outbound
 * email exists yet); the reply text is the same whether or not the account exists.
 */
export function ForgotPasswordInline({ initialEmail = '' }: { initialEmail?: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <div className="mt-3 text-center">
        <button
          type="button"
          className="text-sm underline text-brand-text-secondary"
          onClick={() => {
            setEmail(initialEmail);
            setOpen(true);
          }}
        >
          Forgot password?
        </button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = (await supabase.auth.requestPasswordReset(email.trim())) as {
        message: string | null;
        error: { message: string } | null;
      };
      if (res.error) setError(res.error.message);
      else setMessage(res.message);
    } catch {
      setError('Could not send the request. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="mt-4 space-y-2" onSubmit={submit} aria-label="Forgot password">
      <p className="text-sm font-medium">Reset your password</p>
      {message ? (
        <p className="text-sm" role="status">{message}</p>
      ) : (
        <>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm bg-transparent"
            aria-label="Account email"
          />
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <AppButton type="submit" fullWidth disabled={busy || !email.trim()}>
            {busy ? 'Sending…' : 'Request password reset'}
          </AppButton>
        </>
      )}
      <button type="button" className="text-sm underline" onClick={() => { setOpen(false); setMessage(null); setError(null); }}>
        Back to sign in
      </button>
    </form>
  );
}
