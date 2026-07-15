import { showAppConfirm, showAppPrompt } from '../components/ui/AppConfirm';
import { ID_VERIFICATION_SLOT_LABELS } from './guardIdentityVerification';

export type IdVerificationSlot = 'front' | 'back' | 'selfie';

export function idVerificationSlotLabel(slot: IdVerificationSlot): string {
  return ID_VERIFICATION_SLOT_LABELS[slot];
}

export function buildIdResubmitReason(slots: IdVerificationSlot[], staffNote?: string): string {
  const labels = slots.map(idVerificationSlotLabel);
  const item =
    labels.length === 3
      ? 'ID front, ID back, and identity selfie'
      : labels.length === 1
        ? labels[0]
        : labels.join(', ');
  const note = staffNote?.trim();
  if (note) {
    return `Please resubmit a clearer ${item}. ${note}`;
  }
  return `Please resubmit a clearer ${item}. Make sure the image is well lit, in focus, and all text is readable.`;
}

export function buildCertImageResubmitReason(certName: string, staffNote?: string): string {
  const note = staffNote?.trim();
  if (note) {
    return `Please upload a clearer photo for ${certName}. ${note}`;
  }
  return `Please upload a clearer photo for ${certName}. Make sure the document is fully visible, in focus, and easy to read.`;
}

export function buildCertUpdateRequestReason(certName: string, staffNote?: string): string {
  const note = staffNote?.trim();
  if (note) {
    return `Staff requested an updated ${certName}. ${note}`;
  }
  return `Staff requested an updated ${certName}. Upload a new document when ready — your current verified copy stays on file until the update is approved.`;
}

function formatExpiryDateLabel(expiryDate?: string): string | null {
  if (!expiryDate?.trim()) return null;
  const date = new Date(`${expiryDate.trim()}T12:00:00`);
  if (Number.isNaN(date.getTime())) return expiryDate.trim();
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Automatic update request when a verified credential expires. */
export function buildAutoExpiryUpdateRequestReason(
  credentialLabel: string,
  expiryDate?: string
): string {
  const formattedExpiry = formatExpiryDateLabel(expiryDate);
  if (formattedExpiry) {
    return `${credentialLabel} expired on ${formattedExpiry}. Upload an updated document — your current verified copy stays on file until staff approves the replacement.`;
  }
  return `${credentialLabel} has expired. Upload an updated document — your current verified copy stays on file until staff approves the replacement.`;
}

export const GUARD_APPLICATION_REJECT_DEFAULT_REASON =
  'Your guard application was not approved. Contact Guardr support if you have questions.';

/** Full application rejection — blocks the guard account. Returns null if cancelled. */
export async function promptRejectGuardApplicationNote(): Promise<string | null> {
  return promptRevokeGuardApplicationNote();
}

/** Revoke or deny a guard application — blocks the guard account. Returns null if cancelled. */
export async function promptRevokeGuardApplicationNote(): Promise<string | null> {
  const confirmed = await showAppConfirm({
    title: 'Revoke guard application?',
    message:
      'They will be blocked from the platform and cannot resubmit credentials or get their profile approved.',
    confirmLabel: 'Revoke application',
    cancelLabel: 'Keep reviewing',
    tone: 'danger',
  });
  if (!confirmed) return null;

  const reason = await showAppPrompt({
    title: 'Revocation reason',
    message: 'This message is shown to the guard on their profile.',
    defaultValue: GUARD_APPLICATION_REJECT_DEFAULT_REASON,
    multiline: true,
    confirmLabel: 'Save reason',
  });
  if (reason === null) return null;
  return reason.trim();
}

/** Returns null if cancelled; otherwise trimmed note (may be empty). */
export async function promptStaffResubmitNote(itemLabel: string): Promise<string | null> {
  const reason = await showAppPrompt({
    title: 'Request resubmit',
    message: `What should the guard fix? This note is shown on their profile.\n\n${itemLabel}`,
    defaultValue: 'Image is blurry or hard to read — please upload a clearer photo.',
    multiline: true,
    confirmLabel: 'Send request',
  });
  if (reason === null) return null;
  return reason.trim();
}

/** Returns null if cancelled; otherwise trimmed note (may be empty). */
export async function promptStaffCredentialUpdateNote(itemLabel: string): Promise<string | null> {
  const reason = await showAppPrompt({
    title: 'Request update',
    message: `What should the guard update? Their current verified copy stays on file until you approve a replacement.\n\n${itemLabel}`,
    defaultValue: 'Please upload an updated document — expiration date, number, or clearer photo.',
    multiline: true,
    confirmLabel: 'Send request',
  });
  if (reason === null) return null;
  return reason.trim();
}

export function guardIdReviewIsActionable(status: string | undefined): boolean {
  return status === 'pending' || status === 'verified' || status === 'rejected';
}
