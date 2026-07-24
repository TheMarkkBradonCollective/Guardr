import type { SupabaseClient } from '@supabase/supabase-js';
import type { Certification, SecurityGuard } from '../types';

/** Certification columns loaded in bulk — excludes heavy base64 document photos. */
export const CERTIFICATION_METADATA_COLUMNS =
  'id, guard_id, name, issuer, number, status, issue_date, expiry_date, state, catalog_id, category, rejection_reason, submitted_by_role, revision_history, pending_update, update_requested_at, update_request_note';

export type CertificationImageRow = {
  id: string;
  guard_id?: string;
  image_url: string | null;
};

const CERT_IMAGE_FETCH_CHUNK = 40;

/** Best image URL available on the cert object without a follow-up fetch. */
export function resolveCertImageUrl(cert: Pick<Certification, 'imageUrl' | 'pendingUpdate'>): string | undefined {
  return cert.imageUrl?.trim() || cert.pendingUpdate?.imageUrl?.trim() || undefined;
}

/** Whether this cert may still have a document photo stored in `image_url`. */
export function certNeedsImageHydration(
  cert: Pick<Certification, 'id' | 'imageUrl' | 'pendingUpdate' | 'status'>
): boolean {
  if (resolveCertImageUrl(cert)) return false;
  if (cert.status === 'rejected') return false;
  return cert.status === 'pending' || cert.status === 'verified';
}

export function mergeCertificationImagesIntoGuards(
  guards: SecurityGuard[],
  imagesByGuardId: Map<string, Map<string, string>>
): SecurityGuard[] {
  if (imagesByGuardId.size === 0) return guards;

  return guards.map((guard) => {
    const guardImages = imagesByGuardId.get(guard.id);
    if (!guardImages || guardImages.size === 0) return guard;

    let changed = false;
    const certifications = guard.certifications.map((cert) => {
      const imageUrl = guardImages.get(cert.id);
      if (!imageUrl || cert.imageUrl === imageUrl) return cert;
      changed = true;
      return { ...cert, imageUrl };
    });

    return changed ? { ...guard, certifications } : guard;
  });
}

export function mergeCertificationImagesByCertId(
  guards: SecurityGuard[],
  imagesByCertId: Map<string, string>
): SecurityGuard[] {
  if (imagesByCertId.size === 0) return guards;

  return guards.map((guard) => {
    let changed = false;
    const certifications = guard.certifications.map((cert) => {
      const imageUrl = imagesByCertId.get(cert.id);
      if (!imageUrl || cert.imageUrl === imageUrl) return cert;
      changed = true;
      return { ...cert, imageUrl };
    });
    return changed ? { ...guard, certifications } : guard;
  });
}

function imagesByGuardFromRows(rows: CertificationImageRow[]): Map<string, Map<string, string>> {
  const byGuard = new Map<string, Map<string, string>>();
  for (const row of rows) {
    const imageUrl = row.image_url?.trim();
    if (!imageUrl) continue;
    const guardId = String(row.guard_id);
    const guardMap = byGuard.get(guardId) ?? new Map<string, string>();
    guardMap.set(String(row.id), imageUrl);
    byGuard.set(guardId, guardMap);
  }
  return byGuard;
}

export async function fetchCertificationImagesForGuards(
  supabase: SupabaseClient,
  guardIds: string[]
): Promise<{ imagesByGuardId: Map<string, Map<string, string>>; error: { message?: string } | null }> {
  const uniqueIds = [...new Set(guardIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { imagesByGuardId: new Map(), error: null };
  }

  const { data, error } = await supabase
    .from('certifications')
    .select('id, guard_id, image_url')
    .in('guard_id', uniqueIds);

  if (error) {
    return { imagesByGuardId: new Map(), error };
  }

  return {
    imagesByGuardId: imagesByGuardFromRows((data ?? []) as CertificationImageRow[]),
    error: null,
  };
}

export async function fetchCertificationImagesByCertIds(
  supabase: SupabaseClient,
  certIds: string[]
): Promise<{
  imagesByCertId: Map<string, string>;
  error: { message?: string } | null;
}> {
  const uniqueIds = [...new Set(certIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { imagesByCertId: new Map(), error: null };
  }

  const imagesByCertId = new Map<string, string>();

  for (let offset = 0; offset < uniqueIds.length; offset += CERT_IMAGE_FETCH_CHUNK) {
    const chunk = uniqueIds.slice(offset, offset + CERT_IMAGE_FETCH_CHUNK);
    const { data, error } = await supabase
      .from('certifications')
      .select('id, image_url')
      .in('id', chunk);

    if (error) {
      return { imagesByCertId, error };
    }

    for (const row of (data ?? []) as CertificationImageRow[]) {
      const imageUrl = row.image_url?.trim();
      if (!imageUrl) continue;
      imagesByCertId.set(String(row.id), imageUrl);
    }
  }

  return { imagesByCertId, error: null };
}

export async function fetchCertificationImagesForGuard(
  supabase: SupabaseClient,
  guardId: string
): Promise<{ imagesByCertId: Map<string, string>; error: { message?: string } | null }> {
  const { imagesByGuardId, error } = await fetchCertificationImagesForGuards(supabase, [guardId]);
  return { imagesByCertId: imagesByGuardId.get(guardId) ?? new Map(), error };
}

export function collectCertIdsNeedingImageHydration(
  guards: SecurityGuard[],
  guardIds: string[]
): string[] {
  const targets = new Set(guardIds.filter(Boolean));
  const certIds: string[] = [];

  for (const guard of guards) {
    if (!targets.has(guard.id)) continue;
    for (const cert of guard.certifications) {
      if (certNeedsImageHydration(cert)) {
        certIds.push(cert.id);
      }
    }
  }

  return [...new Set(certIds)];
}

/** @deprecated Use collectCertIdsNeedingImageHydration instead. */
export function guardCertificationsMissingImages(guard: SecurityGuard): boolean {
  return guard.certifications.some((cert) => certNeedsImageHydration(cert));
}

/** @deprecated Use collectCertIdsNeedingImageHydration instead. */
export function certificationRowsNeedImageHydration(
  guards: SecurityGuard[],
  guardIds: string[]
): string[] {
  const targets = new Set(guardIds.filter(Boolean));
  const needsHydration: string[] = [];
  for (const guard of guards) {
    if (!targets.has(guard.id)) continue;
    if (guard.certifications.length === 0) continue;
    if (guard.certifications.some((cert) => certNeedsImageHydration(cert))) {
      needsHydration.push(guard.id);
    }
  }
  return needsHydration;
}

export function applyCertificationImagesToGuard(
  guard: SecurityGuard,
  imagesByCertId: Map<string, string>
): SecurityGuard {
  if (imagesByCertId.size === 0) return guard;
  const [merged] = mergeCertificationImagesByCertId([guard], imagesByCertId);
  return merged;
}

export function certHasHydratedImage(cert: Pick<Certification, 'imageUrl' | 'pendingUpdate'>): boolean {
  return Boolean(resolveCertImageUrl(cert));
}
