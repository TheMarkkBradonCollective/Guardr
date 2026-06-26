import { Certification } from '../types';
import { credentialExpectsStaffVerification, resolveCertCatalogId } from './certCatalog';

export type CertImageMutationResult = { ok: true } | { ok: false; error: string };

export function certDatabaseErrorMessage(error: { code?: string; message?: string }): string {
  if (error.code === '23505') {
    return 'This certificate or license number is already registered. Each number can only be linked to one profile.';
  }
  if (error.code === 'PGRST204' || error.message?.includes('column')) {
    const missing = error.message?.match(/'([^']+)'\s+column/i)?.[1];
    if (missing === 'image_url') {
      return 'Could not save credential photo — database schema is out of date. In Supabase → SQL Editor, run the full script: supabase/fix_everything.sql';
    }
    return 'Could not save — run supabase/fix_everything.sql in Supabase SQL Editor, then try again.';
  }
  if (error.message?.includes('payload') || error.message?.includes('too large')) {
    return 'Photo is too large to save. Try a smaller image or retake the photo.';
  }
  return 'Could not save credential. Please try again.';
}

export const CERT_IMAGE_POLICY_HINT =
  'Upload a photo or scan of the credential document. Once uploaded, the photo cannot be changed or removed.';

export const LICENSE_CREDENTIAL_VERIFY_HINT =
  'Guard cards and weapons permits are verified by Guardr staff so clients can trust they are legitimate.';

export const CERT_DOCUMENT_PHOTO_LABEL = 'Document photo — required';

export const LICENSE_CREDENTIAL_DOCUMENT_PHOTO_LABEL =
  'Document photo — required for staff verification';

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
export function guardCertificationIsLocked(cert: Pick<Certification, 'status' | 'imageUrl'>): boolean {
  if (cert.status === 'verified') return true;
  if (cert.status === 'pending' && certImageIsLocked(cert)) return true;
  return false;
}

export function guardCertificationCanEdit(cert: Pick<Certification, 'status' | 'imageUrl'>): boolean {
  if (cert.status === 'verified') return false;
  if (cert.status === 'rejected') return true;
  if (cert.status === 'pending') return !certImageIsLocked(cert);
  return true;
}

export function certPhotoIsLockedForEditor(
  cert: Pick<Certification, 'imageUrl' | 'status'>,
  staffMode = false
): boolean {
  if (staffMode) return false;
  if (cert.status === 'rejected') return false;
  return certImageIsLocked(cert);
}

/** Only guard cards and weapons permits can be staff-verified. */
export function staffCanVerifyCertification(
  cert: Pick<Certification, 'status' | 'imageUrl' | 'name' | 'catalogId'>
): boolean {
  if (!credentialExpectsStaffVerification(cert)) return false;
  if (cert.status !== 'pending') return false;
  return certHasDocumentProof(cert);
}

export function staffVerifyCertificationBlocker(
  cert: Pick<Certification, 'status' | 'imageUrl' | 'name' | 'catalogId'>
): string | null {
  if (!credentialExpectsStaffVerification(cert)) {
    return 'Training certificates only need to be on file — no staff verification required';
  }
  if (cert.status !== 'pending') return null;
  if (!certHasDocumentProof(cert)) {
    return 'Document photo required — guard card or weapons permit must be on file before staff can verify';
  }
  return null;
}

export { credentialExpectsStaffVerification };
