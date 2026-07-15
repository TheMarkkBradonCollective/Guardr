import { Certification, SecurityGuard } from '../types';
import { credentialExpectsStaffVerification, certDisplayName, resolveCertCatalogId } from './certCatalog';
import { guardApplicationCredentialVerificationBlocker } from './guardApplicationIntake';
import { certHasPendingUpdate, certUpdateSubmissionAllowed } from './certRevisionHistory';

export type CertImageMutationResult = { ok: true } | { ok: false; error: string };

export function certDatabaseErrorMessage(error: { code?: string; message?: string }): string {
  if (error.code === '23505') {
    return 'This certificate or license number is already registered. Each number can only be linked to one profile.';
  }
  if (error.code === 'PGRST204' || error.message?.includes('column')) {
    const missing = error.message?.match(/'([^']+)'\s+column/i)?.[1];
    if (missing === 'image_url') {
      return 'Could not save credential photo — database schema is out of date. In Supabase → SQL Editor, run: supabase/complete_schema_setup.sql';
    }
    return 'Could not save — run supabase/complete_schema_setup.sql in Supabase SQL Editor, then try again.';
  }
  if (error.message?.includes('payload') || error.message?.includes('too large')) {
    return 'Photo is too large to save. Try a smaller image or retake the photo.';
  }
  return 'Could not save credential. Please try again.';
}

export const CERT_IMAGE_POLICY_HINT =
  'Upload a photo or scan of the credential document. Once uploaded, the photo cannot be changed or removed.';

export const LICENSE_CREDENTIAL_VERIFY_HINT =
  'Guardr staff can verify any credential on file so clients can trust it is legitimate.';

export const CERT_DOCUMENT_PHOTO_LABEL = 'Document photo — required';

export const LICENSE_CREDENTIAL_DOCUMENT_PHOTO_LABEL =
  'Document photo — required before staff can verify for clients';

/** Credential has a document photo on file (proof of credential). */
export function certHasDocumentProof(cert: Pick<Certification, 'imageUrl'>): boolean {
  return Boolean(cert.imageUrl?.trim());
}

/** Credential document photo has been uploaded and is locked. */
export function certImageIsLocked(cert: Pick<Certification, 'imageUrl'>): boolean {
  return certHasDocumentProof(cert);
}

export function validateCertSubmission(imageUrl: string | undefined): CertImageMutationResult {
  if (!imageUrl?.trim()) {
    return { ok: false, error: 'Upload a photo or scan of the credential document.' };
  }
  return { ok: true };
}

export function guardCanDeleteCertification(cert: Pick<Certification, 'imageUrl'>): boolean {
  return !certImageIsLocked(cert);
}

export function guardCanAttachCertImage(cert: Pick<Certification, 'imageUrl' | 'status'>): boolean {
  if (cert.status === 'rejected') return true;
  return !certImageIsLocked(cert);
}

export function validateCertImageAttachment(
  cert: Pick<Certification, 'imageUrl' | 'status'>,
  imageUrl: string | undefined
): CertImageMutationResult {
  if (cert.status !== 'rejected' && certImageIsLocked(cert)) {
    return { ok: false, error: 'This credential photo cannot be changed after upload.' };
  }
  const trimmed = imageUrl?.trim();
  if (!trimmed) {
    return { ok: false, error: 'Choose a photo or scan to upload.' };
  }
  return { ok: true };
}

export function validateCertDeletion(cert: Pick<Certification, 'imageUrl'>): CertImageMutationResult {
  if (certImageIsLocked(cert)) {
    return {
      ok: false,
      error: 'Credentials with an uploaded photo cannot be removed. Contact Guardr support if you need help.',
    };
  }
  return { ok: true };
}

/** Credential fields are locked while pending review or after verification. */
export function guardCertificationIsLocked(
  cert: Pick<Certification, 'status' | 'imageUrl' | 'updateRequestedAt' | 'pendingUpdate'>
): boolean {
  if (certUpdateSubmissionAllowed(cert)) return false;
  if (cert.status === 'verified') return true;
  if (cert.status === 'pending' && certImageIsLocked(cert)) return true;
  return false;
}

export function guardCertificationCanEdit(
  cert: Pick<Certification, 'status' | 'imageUrl' | 'updateRequestedAt' | 'pendingUpdate'>
): boolean {
  if (certUpdateSubmissionAllowed(cert)) return true;
  if (cert.status === 'verified') return false;
  if (cert.status === 'rejected') return true;
  if (cert.status === 'pending') return !certImageIsLocked(cert);
  return true;
}

export function certPhotoIsLockedForEditor(
  cert: Pick<Certification, 'imageUrl' | 'status' | 'updateRequestedAt' | 'pendingUpdate'>,
  staffMode = false
): boolean {
  if (staffMode) return false;
  if (certUpdateSubmissionAllowed(cert)) return false;
  if (cert.status === 'rejected') return false;
  return certImageIsLocked(cert);
}

/** Any credential with a document photo can be staff-verified for client-facing trust. */
export function staffCanVerifyCertification(
  cert: Pick<
    Certification,
    'status' | 'imageUrl' | 'name' | 'catalogId' | 'pendingUpdate' | 'updateRequestedAt'
  >,
  guard?: Pick<SecurityGuard, 'name' | 'userStatus' | 'isStaff' | 'mustChangePassword'>
): boolean {
  return staffVerifyCertificationBlocker(cert, guard) === null;
}

export function staffVerifyCertificationBlocker(
  cert: Pick<
    Certification,
    'status' | 'imageUrl' | 'name' | 'catalogId' | 'pendingUpdate' | 'updateRequestedAt'
  >,
  guard?: Pick<SecurityGuard, 'name' | 'userStatus' | 'isStaff' | 'mustChangePassword'>
): string | null {
  if (guard) {
    const applicationBlocker = guardApplicationCredentialVerificationBlocker(
      guard,
      certDisplayName(cert)
    );
    if (applicationBlocker) return applicationBlocker;
  }
  if (certHasPendingUpdate(cert)) {
    if (!cert.pendingUpdate?.imageUrl?.trim()) {
      return 'Updated document photo required before staff can verify';
    }
    return null;
  }
  if (cert.status !== 'pending') return 'Only pending credentials can be verified';
  if (!certHasDocumentProof(cert)) {
    return 'Document photo required — credential must be on file before staff can verify for clients';
  }
  return null;
}

export { credentialExpectsStaffVerification };
