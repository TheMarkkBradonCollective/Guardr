import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeGuardServiceAreas } from '../../src/lib/californiaCities.ts';
import {
  defaultAvailabilitySlots,
  guardIsAvailableForJob,
  type GuardAvailabilityDateOverride,
  type GuardAvailabilitySchedule,
  type GuardAvailabilitySlot,
} from '../../src/lib/guardAvailability.ts';
import { normalizeJobTypePreferences } from '../../src/lib/guardJobPreferences.ts';
import { guardShouldNotifyForOpenJob } from '../../src/lib/guardOpenJobNotify.ts';
import type { JobType } from '../../src/types.ts';

export interface OpenJobNotifyContext {
  type: JobType | string;
  state?: string | null;
  startDate: string;
  endDate: string;
}

function parseJsonStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function timeToHHMM(value: string): string {
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  return trimmed.slice(0, 5);
}

function mapWeeklySlot(row: Record<string, unknown>): GuardAvailabilitySlot {
  return {
    id: String(row.id),
    guardId: String(row.guard_id),
    dayOfWeek: Number(row.day_of_week),
    startTime: timeToHHMM(String(row.start_time ?? '08:00')),
    endTime: timeToHHMM(String(row.end_time ?? '18:00')),
    isAvailable: row.is_available !== false,
    notes: typeof row.notes === 'string' ? row.notes : undefined,
  };
}

function mapDateOverride(row: Record<string, unknown>): GuardAvailabilityDateOverride {
  return {
    id: String(row.id),
    guardId: String(row.guard_id),
    date: String(row.date).slice(0, 10),
    startTime: timeToHHMM(String(row.start_time ?? '00:00')),
    endTime: timeToHHMM(String(row.end_time ?? '23:59')),
    isAvailable: row.is_available === true,
    notes: typeof row.notes === 'string' ? row.notes : undefined,
  };
}

function buildScheduleMap(
  guardIds: string[],
  weeklyRows: Record<string, unknown>[],
  overrideRows: Record<string, unknown>[]
): Map<string, GuardAvailabilitySchedule> {
  const weeklyByGuard = new Map<string, GuardAvailabilitySlot[]>();
  for (const row of weeklyRows) {
    const guardId = String(row.guard_id);
    const slots = weeklyByGuard.get(guardId) ?? [];
    slots.push(mapWeeklySlot(row));
    weeklyByGuard.set(guardId, slots);
  }

  const overridesByGuard = new Map<string, GuardAvailabilityDateOverride[]>();
  for (const row of overrideRows) {
    const guardId = String(row.guard_id);
    const overrides = overridesByGuard.get(guardId) ?? [];
    overrides.push(mapDateOverride(row));
    overridesByGuard.set(guardId, overrides);
  }

  const schedules = new Map<string, GuardAvailabilitySchedule>();
  for (const guardId of guardIds) {
    schedules.set(guardId, {
      weeklySlots: weeklyByGuard.get(guardId) ?? defaultAvailabilitySlots(guardId),
      dateOverrides: overridesByGuard.get(guardId) ?? [],
    });
  }
  return schedules;
}

/** Active verified guards who should receive job_open_to_guards for this job. */
export async function findGuardsToNotifyForOpenJob(
  db: SupabaseClient,
  job: OpenJobNotifyContext
): Promise<string[]> {
  const { data: guardRows, error } = await db
    .from('guards')
    .select('id, service_areas, job_type_preferences')
    .eq('user_status', 'active')
    .eq('verified', true)
    .neq('is_staff', true);

  if (error) throw new Error(error.message);
  if (!guardRows?.length) return [];

  const guardIds = guardRows.map((row) => String(row.id));
  const [{ data: weeklyRows }, { data: overrideRows }] = await Promise.all([
    db.from('guard_availability').select('*').in('guard_id', guardIds),
    db.from('guard_availability_date_overrides').select('*').in('guard_id', guardIds),
  ]);

  const schedules = buildScheduleMap(
    guardIds,
    (weeklyRows ?? []) as Record<string, unknown>[],
    (overrideRows ?? []) as Record<string, unknown>[]
  );

  const jobMatch = {
    type: job.type as JobType,
    state: job.state ?? undefined,
    startDate: job.startDate,
    endDate: job.endDate,
  };

  const matching: string[] = [];
  for (const row of guardRows) {
    const guardId = String(row.id);
    const guard = {
      id: guardId,
      serviceAreas: normalizeGuardServiceAreas(parseJsonStringArray(row.service_areas)),
      jobTypePreferences: normalizeJobTypePreferences(parseJsonStringArray(row.job_type_preferences)),
    };
    if (guardShouldNotifyForOpenJob(guard, jobMatch, schedules.get(guardId))) {
      matching.push(guardId);
    }
  }

  return matching;
}
