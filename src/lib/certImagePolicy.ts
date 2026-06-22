import { Certification } from '../types';

export type CertImageMutationResult = { ok: true } | { ok: false; error: string };

export const CERT_IMAGE_POLICY_HINT =
  'Upload a photo or scan of the credential document — required for staff verification. Once uploaded, the photo cannot be changed or removed.';

export const CERT_DOCUMENT_PHOTO_LABEL = 'Document photo — required for staff verification';

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

export function guardCanAttachCertImage(cert: Pick<Certification, 'imageUrl'>): boolean {
  return !certImageIsLocked(cert);
}

export function validateCertImageAttachment(
  cert: Pick<Certification, 'imageUrl'>,
  imageUrl: string | undefined
): CertImageMutationResult {
  if (certImageIsLocked(cert)) {
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
