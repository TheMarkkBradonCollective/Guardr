/** Guards upload in profile edit; staff can upload on behalf of a guard in view mode too. */
export function canUploadGuardCredentials(
  editing: boolean,
  staffMode: boolean,
  onAddCertification?: unknown
): boolean {
  return Boolean((editing || staffMode) && onAddCertification);
}

export function staffCredentialUploadLabel(staffMode: boolean, itemLabel: string): string {
  return staffMode ? `Upload ${itemLabel} for guard` : `Upload ${itemLabel}`;
}
