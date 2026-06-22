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

export const GUARD_APPLICATION_REJECT_DEFAULT_REASON =
  'Your guard application was not approved. Contact Guardr support if you have questions.';

/** Full application rejection — blocks the guard account. Returns null if cancelled. */
export function promptRejectGuardApplicationNote(): string | null {
  const confirmed = window.confirm(
    'Reject this guard\'s application?\n\nThey will be blocked from the platform and cannot resubmit ID documents or get their profile approved.'
  );
  if (!confirmed) return null;

  const reason = window.prompt(
    'Rejection reason (shown to guard):',
    GUARD_APPLICATION_REJECT_DEFAULT_REASON
  );
  if (reason === null) return null;
  return reason.trim();
}

/** Returns null if cancelled; otherwise trimmed note (may be empty). */
export function promptStaffResubmitNote(itemLabel: string): string | null {
  const reason = window.prompt(
    `What should the guard fix? (shown on their profile)\n\n${itemLabel}`,
    'Image is blurry or hard to read — please upload a clearer photo.'
  );
  if (reason === null) return null;
  return reason.trim();
}

export function guardIdReviewIsActionable(status: string | undefined): boolean {
  return status === 'pending' || status === 'verified' || status === 'rejected';
}
