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
