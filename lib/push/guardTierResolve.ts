import type { SupabaseClient } from '@supabase/supabase-js';
import { computeGuardPerformanceRating } from '../../src/lib/guardPerformance.ts';
import {
  performanceTierId,
  type PerformanceTierId,
} from '../../src/lib/guardTierJobPriority.ts';
import type { SecurityGuard, SecurityRequest } from '../../src/types.ts';

interface TierRequestRow {
  id: string;
  status: string;
  assigned_guard_id: string | null;
  applicants: string[] | null;
  start_date: string;
  end_date: string;
  rating_given: number | null;
  check_in_audit: SecurityRequest['checkInAudit'] | null;
  no_show: boolean | null;
}

function mapTierRequestRow(row: TierRequestRow): SecurityRequest {
  return {
    id: row.id,
    status: row.status,
    assignedGuardId: row.assigned_guard_id,
    applicants: row.applicants ?? [],
    startDate: row.start_date,
    endDate: row.end_date,
    ratingGiven: row.rating_given ?? undefined,
    checkInAudit: row.check_in_audit ?? undefined,
    noShow: row.no_show ?? undefined,
  } as SecurityRequest;
}

/** Load historical jobs used to compute performance tiers for open-job notifications. */
export async function loadRequestsForGuardTierBatch(
  db: SupabaseClient,
  guardIds: string[]
): Promise<SecurityRequest[]> {
  if (!guardIds.length) return [];

  const select =
    'id, status, assigned_guard_id, applicants, start_date, end_date, rating_given, check_in_audit, no_show';

  const [{ data: assignedRows, error: assignedError }, { data: applicantRows, error: applicantError }] =
    await Promise.all([
      db.from('security_requests').select(select).in('assigned_guard_id', guardIds),
      db.from('security_requests').select(select).overlaps('applicants', guardIds),
    ]);

  if (assignedError) throw new Error(assignedError.message);
  if (applicantError) throw new Error(applicantError.message);

  const byId = new Map<string, SecurityRequest>();
  for (const row of [...(assignedRows ?? []), ...(applicantRows ?? [])] as TierRequestRow[]) {
    byId.set(row.id, mapTierRequestRow(row));
  }
  return [...byId.values()];
}

export async function resolveGuardTierMap(
  db: SupabaseClient,
  guards: Array<Pick<SecurityGuard, 'id' | 'failedAudits'>>
): Promise<Map<string, PerformanceTierId>> {
  const guardIds = guards.map((guard) => guard.id);
  const requests = await loadRequestsForGuardTierBatch(db, guardIds);
  const tiers = new Map<string, PerformanceTierId>();

  for (const guard of guards) {
    const guardRequests = requests.filter(
      (request) =>
        request.assignedGuardId === guard.id || (request.applicants ?? []).includes(guard.id)
    );
    const tier = performanceTierId(
      computeGuardPerformanceRating(guard as SecurityGuard, guardRequests).tier
    );
    tiers.set(guard.id, tier);
  }

  return tiers;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { sleep };
