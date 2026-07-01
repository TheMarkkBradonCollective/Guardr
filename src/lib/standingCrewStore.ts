import type { GuardStandingCrewMember } from '../types';
import { standingCrewRowFromDb, standingCrewRowToDb } from './guardStandingCrew';
import { supabase } from './supabase';

const LOCAL_KEY = 'guardr_standing_crew_v1';

function readLocal(): GuardStandingCrewMember[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GuardStandingCrewMember[];
  } catch {
    return [];
  }
}

function writeLocal(rows: GuardStandingCrewMember[]): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

export async function loadStandingCrewMembers(isDbConnected: boolean): Promise<GuardStandingCrewMember[]> {
  if (!isDbConnected) return readLocal();
  const { data, error } = await supabase
    .from('guard_standing_crew_members')
    .select('*')
    .neq('status', 'removed')
    .order('invited_at', { ascending: false });
  if (error) {
    console.warn('loadStandingCrewMembers:', error.message);
    return readLocal();
  }
  const rows = (data ?? []).map((row) => standingCrewRowFromDb(row as Record<string, unknown>));
  writeLocal(rows);
  return rows;
}

export async function persistStandingCrewMember(
  member: GuardStandingCrewMember,
  isDbConnected: boolean
): Promise<void> {
  const local = readLocal();
  const merged = [...local.filter((m) => m.id !== member.id), member];
  writeLocal(merged);
  if (!isDbConnected) return;
  const { error } = await supabase.from('guard_standing_crew_members').upsert(standingCrewRowToDb(member));
  if (error) console.warn('persistStandingCrewMember:', error.message);
}

export async function persistStandingCrewMembers(
  members: GuardStandingCrewMember[],
  isDbConnected: boolean
): Promise<void> {
  writeLocal(members);
  if (!isDbConnected) return;
  const active = members.filter((m) => m.status !== 'removed').slice(0, 100);
  if (active.length === 0) return;
  const { error } = await supabase.from('guard_standing_crew_members').upsert(active.map(standingCrewRowToDb));
  if (error) console.warn('persistStandingCrewMembers:', error.message);
}
