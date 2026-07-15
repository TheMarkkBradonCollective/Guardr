import type { SupabaseClient } from '@supabase/supabase-js';
import { isPushConfigured } from './config';
import { dispatchPushNotification } from './delivery';

interface PriorityCrewLeadRow {
  id: string;
  crewSize: number;
}

async function findPriorityCrewLeadIds(
  db: SupabaseClient,
  guardsNeeded: number
): Promise<PriorityCrewLeadRow[]> {
  const needed = Math.max(1, guardsNeeded);

  const { data: trustedGuards, error: guardError } = await db
    .from('guards')
    .select('id')
    .eq('trusted', true)
    .neq('is_staff', true);

  if (guardError) throw new Error(guardError.message);
  const leadIds = (trustedGuards ?? []).map((g) => g.id).filter(Boolean);
  if (!leadIds.length) return [];

  const { data: crewRows, error: crewError } = await db
    .from('guard_standing_crew_members')
    .select('lead_guard_id')
    .in('lead_guard_id', leadIds)
    .eq('status', 'active');

  if (crewError) throw new Error(crewError.message);

  const activeCountByLead = new Map<string, number>();
  for (const row of crewRows ?? []) {
    const leadId = row.lead_guard_id as string;
    activeCountByLead.set(leadId, (activeCountByLead.get(leadId) ?? 0) + 1);
  }

  const leads: PriorityCrewLeadRow[] = [];
  for (const leadId of leadIds) {
    const crewSize = 1 + (activeCountByLead.get(leadId) ?? 0);
    if (crewSize >= needed) {
      leads.push({ id: leadId, crewSize });
    }
  }

  return leads.sort((a, b) => b.crewSize - a.crewSize);
}

export async function notifyPriorityCrewForOpenJob(
  db: SupabaseClient,
  options: {
    requestId: string;
    title: string;
    location?: string;
    guardsNeeded: number;
  }
): Promise<number> {
  if (!isPushConfigured()) return 0;

  const leads = await findPriorityCrewLeadIds(db, options.guardsNeeded);
  if (!leads.length) return 0;

  const needed = Math.max(1, options.guardsNeeded);
  let sent = 0;

  for (const lead of leads) {
    const result = await dispatchPushNotification(db, {
      userId: lead.id,
      title: 'Priority job — your crew qualifies',
      body: `"${options.title}" needs ${needed} guard${needed > 1 ? 's' : ''} — your crew of ${lead.crewSize} qualifies. Apply early.`,
      type: 'job_open_to_guards',
      requestId: options.requestId,
      siteId: options.location,
      priority: 'high',
    });
    sent += result.sent;
  }

  return sent;
}

export async function notifyOpenJobToGuards(
  db: SupabaseClient,
  options: {
    requestId: string;
    title: string;
    body: string;
    location?: string;
    guardsNeeded?: number;
  }
): Promise<void> {
  if (!isPushConfigured()) return;

  if (options.guardsNeeded != null && options.guardsNeeded > 0) {
    await notifyPriorityCrewForOpenJob(db, {
      requestId: options.requestId,
      title: options.title,
      location: options.location,
      guardsNeeded: options.guardsNeeded,
    });
  }

  await dispatchPushNotification(db, {
    role: 'guard',
    title: 'New job on the map',
    body: options.body,
    type: 'job_open_to_guards',
    requestId: options.requestId,
    siteId: options.location,
  });
}
