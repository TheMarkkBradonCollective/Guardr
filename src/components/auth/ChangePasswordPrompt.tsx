import React, { useState } from 'react';
import { KeyRound, X } from 'lucide-react';

interface ChangePasswordPromptProps {
  open: boolean;
  userName: string;
  onChangePassword: (newPassword: string) => void | Promise<void>;
  onDismiss: () => void;
}

export function ChangePasswordPrompt({
  open,
  userName,
  onChangePassword,
  onDismiss,
}: ChangePasswordPromptProps) {
  const [mode, setMode] = useState<'prompt' | 'form'>('prompt');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const resetForm = () => {
    setMode('prompt');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await onChangePassword(newPassword);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50">
      <div
        className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-bg shadow-xl p-6 space-y-4"
        role="dialog"
        aria-labelledby="change-password-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 id="change-password-title" className="font-bold text-lg">
                {mode === 'prompt' ? 'Change your password' : 'Set a new password'}
              </h2>
              <p className="text-sm text-brand-text-muted mt-0.5">Hi {userName}</p>
            </div>
          </div>
          {mode === 'form' && (
            <button
              type="button"
              onClick={() => setMode('prompt')}
              className="p-1.5 text-brand-text-muted hover:text-brand-text"
              aria-label="Back"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {mode === 'prompt' ? (
          <>
            <p className="text-sm text-brand-text-muted leading-relaxed">
              You are still using the default password assigned when your account was created.
              For security, you should choose your own password.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('form')}
                className="app-button-primary flex-1"
              >
                Yes, change now
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="app-button-outline flex-1"
              >
                Do it later
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="uber-label block mb-1">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="uber-input w-full"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="uber-label block mb-1">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="uber-input w-full"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={busy} className="w-full app-button-primary disabled:opacity-50">
              {busy ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
