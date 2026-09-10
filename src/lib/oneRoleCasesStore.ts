export async function persistOneRoleCase(oneRoleCase: import('./oneRolePolicy').OneRoleCase): Promise<void> {
  const { supabase } = await import('./supabase');
  const { error } = await supabase.from('one_role_cases').upsert({
    id: oneRoleCase.id,
    status: oneRoleCase.status,
    reason: oneRoleCase.reason,
    match_kind: oneRoleCase.matchKind,
    accounts: oneRoleCase.accounts,
    created_at: oneRoleCase.createdAt,
    reviewed_at: oneRoleCase.reviewedAt ?? null,
    reviewed_by: oneRoleCase.reviewedByStaffId ?? null,
  });
  if (error && error.code !== '42P01') {
    console.warn('one_role_cases persist:', error.message);
  }
}

export async function loadOneRoleCases(): Promise<import('./oneRolePolicy').OneRoleCase[]> {
  const { supabase } = await import('./supabase');
  const { data, error } = await supabase.from('one_role_cases').select('*');
  if (error) {
    if (error.code !== '42P01') console.warn('one_role_cases load:', error.message);
    return [];
  }
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    status: row.status === 'ignored' || row.status === 'blocked' ? row.status : 'open',
    reason: String(row.reason ?? ''),
    matchKind:
      row.match_kind === 'phone' || row.match_kind === 'device' ? row.match_kind : 'email',
    accounts: Array.isArray(row.accounts) ? (row.accounts as import('./oneRolePolicy').OneRoleAccountRef[]) : [],
    createdAt: String(row.created_at ?? ''),
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : undefined,
    reviewedByStaffId: row.reviewed_by ? String(row.reviewed_by) : undefined,
  }));
}
