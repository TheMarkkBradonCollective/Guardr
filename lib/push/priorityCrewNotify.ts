import type { SupabaseClient } from '@supabase/supabase-js';
import { isPushConfigured } from './config';
import { dispatchPushNotification } from './delivery';
import { findGuardsToNotifyForOpenJob } from './guardOpenJobRecipients';

interface PriorityCrewLeadRow {
  id: string;
  crewSize: number;
}

async function findPriorityCrewLeadIds(
  db: SupabaseClient,
  guardsNeeded: number,
  eligibleLeadIds: Set<string>
): Promise<PriorityCrewLeadRow[]> {
  const needed = Math.max(1, guardsNeeded);

  const { data: trustedGuards, error: guardError } = await db
    .from('guards')
    .select('id')
    .eq('trusted', true)
    .neq('is_staff', true);

  if (guardError) throw new Error(guardError.message);
  const leadIds = (trustedGuards ?? [])
    .map((g) => g.id as string)
    .filter((id) => id && eligibleLeadIds.has(id));
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
    eligibleLeadIds: Set<string>;
  }
): Promise<string[]> {
  if (!isPushConfigured()) return [];

  const leads = await findPriorityCrewLeadIds(
    db,
    options.guardsNeeded,
    options.eligibleLeadIds
  );
  if (!leads.length) return [];

  const needed = Math.max(1, options.guardsNeeded);
  const notified: string[] = [];

  for (const lead of leads) {
    await dispatchPushNotification(db, {
      userId: lead.id,
      title: 'Priority job — your crew qualifies',
      body: `"${options.title}" needs ${needed} guard${needed > 1 ? 's' : ''} — your crew of ${lead.crewSize} qualifies. Apply early.`,
      type: 'job_open_to_guards',
      requestId: options.requestId,
      siteId: options.location,
      priority: 'high',
    });
    notified.push(lead.id);
  }

  return notified;
}

export async function notifyOpenJobToGuards(
  db: SupabaseClient,
  options: {
    requestId: string;
    title: string;
    body: string;
    location?: string;
    guardsNeeded?: number;
    type: string;
    state?: string | null;
    startDate: string;
    endDate: string;
  }
): Promise<void> {
  if (!isPushConfigured()) return;

  const recipients = await findGuardsToNotifyForOpenJob(db, {
    type: options.type,
    state: options.state,
    startDate: options.startDate,
    endDate: options.endDate,
  });
  if (!recipients.length) return;

  const recipientSet = new Set(recipients);
  const notified = new Set<string>();

  if (options.guardsNeeded != null && options.guardsNeeded > 0) {
    const priorityLeads = await notifyPriorityCrewForOpenJob(db, {
      requestId: options.requestId,
      title: options.title,
      location: options.location,
      guardsNeeded: options.guardsNeeded,
      eligibleLeadIds: recipientSet,
    });
    for (const leadId of priorityLeads) notified.add(leadId);
  }

  for (const guardId of recipients) {
    if (notified.has(guardId)) continue;
    await dispatchPushNotification(db, {
      userId: guardId,
      title: 'New job on the map',
      body: options.body,
      type: 'job_open_to_guards',
      requestId: options.requestId,
      siteId: options.location,
    });
  }
}
