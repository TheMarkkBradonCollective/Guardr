import type { GuardCrewJoinRequest } from '../types';
import { crewJoinRequestRowFromDb, crewJoinRequestRowToDb } from './guardCrewJoinRequest';
import { supabase } from './supabase';

const LOCAL_KEY = 'guardr_crew_join_requests_v1';

function readLocal(): GuardCrewJoinRequest[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GuardCrewJoinRequest[];
  } catch {
    return [];
  }
}

function writeLocal(rows: GuardCrewJoinRequest[]): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

export async function loadCrewJoinRequests(isDbConnected: boolean): Promise<GuardCrewJoinRequest[]> {
  if (!isDbConnected) return readLocal();
  const { data, error } = await supabase
    .from('guard_crew_join_requests')
    .select('*')
    .order('requested_at', { ascending: false });
  if (error) {
    console.warn('loadCrewJoinRequests:', error.message);
    return readLocal();
  }
  const rows = (data ?? []).map((row) => crewJoinRequestRowFromDb(row as Record<string, unknown>));
  writeLocal(rows);
  return rows;
}

export async function persistCrewJoinRequest(
  request: GuardCrewJoinRequest,
  isDbConnected: boolean
): Promise<void> {
  const local = readLocal();
  const merged = [...local.filter((r) => r.id !== request.id), request];
  writeLocal(merged);
  if (!isDbConnected) return;
  const { error } = await supabase
    .from('guard_crew_join_requests')
    .upsert(crewJoinRequestRowToDb(request));
  if (error) console.warn('persistCrewJoinRequest:', error.message);
}
