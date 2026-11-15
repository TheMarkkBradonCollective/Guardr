import React, { useState } from 'react';
import { AppButton } from '../ui/AppButton';
import { showAppConfirm } from '../ui/AppConfirm';
import { showAppToast } from '../ui/AppToast';
import { apiUrl } from '../../lib/siteConfig';
import { userFacingError } from '../../lib/userFacingError';

interface StaffResetPasswordButtonProps {
  profileKind: 'guard' | 'client' | 'staff';
  profileId: string;
  name: string;
}

/** Administrator+: give an account a one-time temporary password (no email reset yet). */
export function StaffResetPasswordButton({ profileKind, profileId, name }: StaffResetPasswordButtonProps) {
  const [pending, setPending] = useState(false);
  const run = async () => {
    const ok = await showAppConfirm({
      title: `Reset ${name}'s password?`,
      message:
        'They will be signed out everywhere and must sign in with a temporary password, then choose a new one.',
      confirmLabel: 'Reset password',
      tone: 'danger',
    });
    if (!ok) return;
    setPending(true);
    try {
      const res = await fetch(apiUrl('/api/auth/staff-reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileKind, profileId }),
      });
      const data = (await res.json().catch(() => ({}))) as { temporaryPassword?: string; error?: string };
      if (!res.ok || !data.temporaryPassword) throw new Error(data.error ?? 'Could not reset password');
      try {
        await navigator.clipboard?.writeText(data.temporaryPassword);
      } catch {
        /* clipboard may be blocked; the password is shown below */
      }
      await showAppConfirm({
        title: 'Temporary password',
        message: `${data.temporaryPassword}\n\nShare it with ${name} privately. It works once; they must choose a new password at sign-in. (Copied to clipboard if allowed.)`,
        confirmLabel: 'Done',
        cancelLabel: 'Close',
      });
    } catch (err) {
      showAppToast(userFacingError(err, 'Could not reset password.'), { tone: 'error' });
    } finally {
      setPending(false);
    }
  };
  return (
    <AppButton variant="outline" size="sm" disabled={pending} onClick={() => void run()} title="Issue a one-time temporary password">
      Reset password
    </AppButton>
  );
}
