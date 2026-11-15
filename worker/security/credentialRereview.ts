/**
 * A guard who edits the document fields of an already-verified credential sends it back to
 * staff review: the row's status becomes 'pending' in the same write.
 */
type Row = Record<string, unknown>;

export interface CredentialReviewRule {
  statusCol: string;
  ownerCol: string;
  docCols: readonly string[];
}

export const CREDENTIAL_REVIEW_RULES: Record<string, CredentialReviewRule> = {
  guards: {
    statusCol: 'id_verification_status',
    ownerCol: 'id',
    docCols: ['id_state', 'id_number', 'id_expiry_date', 'id_front_url', 'id_back_url', 'id_selfie_url', 'id_document_type', 'id_license_class'],
  },
  certifications: {
    statusCol: 'status',
    ownerCol: 'guard_id',
    docCols: ['name', 'issuer', 'number', 'issue_date', 'expiry_date', 'state', 'catalog_id', 'image_url'],
  },
  guard_insurance_policies: {
    statusCol: 'status',
    ownerCol: 'guard_id',
    docCols: ['carrier', 'policy_number', 'general_liability_limit', 'effective_date', 'expiry_date', 'document_url'],
  },
  guard_vehicle_insurance_policies: {
    statusCol: 'status',
    ownerCol: 'guard_id',
    docCols: ['carrier', 'policy_number', 'effective_date', 'expiry_date', 'document_url'],
  },
  guard_vehicle_profiles: {
    statusCol: 'status',
    ownerCol: 'guard_id',
    docCols: ['make', 'model', 'year', 'color', 'plate_number', 'plate_state', 'front_photo_url', 'left_side_photo_url', 'right_side_photo_url', 'back_photo_url', 'vehicle_insurance_policy_id'],
  },
};

function norm(v: unknown): string {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  // Dates come back as full timestamps; compare the day only.
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s.slice(0, 10) : s;
}

/** True when `patch` changes a document field on a verified `existing` row. */
export function editsVerifiedCredential(table: string, patch: Row, existing: Row): boolean {
  const rule = CREDENTIAL_REVIEW_RULES[table];
  if (!rule) return false;
  if (existing[rule.statusCol] !== 'verified') return false;
  return rule.docCols.some((col) => col in patch && norm(patch[col]) !== norm(existing[col]));
}

/** Patch to write: unchanged, or with the status sent back to 'pending'. */
export function withRereview(table: string, patch: Row, existingRows: Row[]): Row {
  const rule = CREDENTIAL_REVIEW_RULES[table];
  if (!rule) return patch;
  if (existingRows.some((row) => editsVerifiedCredential(table, patch, row))) {
    return { ...patch, [rule.statusCol]: 'pending' };
  }
  return patch;
}
