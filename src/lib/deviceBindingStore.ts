import type { OneRoleKind } from './oneRolePolicy';
import type { DeviceRoleAppClaim } from './deviceRoleClaim';
import { writeDeviceRoleAppClaim } from './deviceRoleClaim';

export interface DeviceAccountBinding {
  deviceId: string;
  accountKind: OneRoleKind | null;
  accountId: string | null;
  roleAppClaim: DeviceRoleAppClaim | null;
  updatedAt: string;
}

function rowToBinding(row: Record<string, unknown>): DeviceAccountBinding {
  const claim = row.role_app_claim;
  return {
    deviceId: String(row.device_id),
    accountKind:
      row.account_kind === 'guard' || row.account_kind === 'client' || row.account_kind === 'staff'
        ? row.account_kind
        : null,
    accountId: row.account_id ? String(row.account_id) : null,
    roleAppClaim:
      claim === 'client' || claim === 'guard' || claim === 'staff' ? claim : null,
    updatedAt: String(row.updated_at ?? ''),
  };
}

export async function fetchDeviceAccountBinding(deviceId: string): Promise<DeviceAccountBinding | null> {
  const { supabase } = await import('./supabase');
  const { data, error } = await supabase
    .from('device_account_bindings')
    .select('device_id, account_kind, account_id, role_app_claim, updated_at')
    .eq('device_id', deviceId)
    .maybeSingle();
  if (error) {
    if (error.code !== '42P01') console.warn('device_account_bindings fetch:', error.message);
    return null;
  }
  if (!data) return null;
  return rowToBinding(data as Record<string, unknown>);
}

export function deviceBindingBlocksAccount(
  binding: DeviceAccountBinding | null,
  account: { kind: OneRoleKind; id: string },
): boolean {
  if (!binding?.accountId || !binding.accountKind) return false;
  return binding.accountKind !== account.kind || binding.accountId !== account.id;
}

export async function upsertDeviceAccountBinding(input: {
  deviceId: string;
  accountKind: OneRoleKind;
  accountId: string;
  roleAppClaim?: DeviceRoleAppClaim | null;
}): Promise<void> {
  const { supabase } = await import('./supabase');
  const payload: Record<string, unknown> = {
    device_id: input.deviceId,
    account_kind: input.accountKind,
    account_id: input.accountId,
    updated_at: new Date().toISOString(),
  };
  if (input.roleAppClaim) payload.role_app_claim = input.roleAppClaim;

  const { error } = await supabase.from('device_account_bindings').upsert(payload);
  if (error && error.code !== '42P01') {
    console.warn('device_account_bindings upsert:', error.message);
  }
  if (input.roleAppClaim) writeDeviceRoleAppClaim(input.roleAppClaim);
}

export async function registerDeviceRoleAppClaim(
  deviceId: string,
  roleAppClaim: DeviceRoleAppClaim,
): Promise<void> {
  writeDeviceRoleAppClaim(roleAppClaim);
  const { supabase } = await import('./supabase');
  const existing = await fetchDeviceAccountBinding(deviceId);
  if (existing) {
    const { error } = await supabase
      .from('device_account_bindings')
      .update({
        role_app_claim: roleAppClaim,
        updated_at: new Date().toISOString(),
      })
      .eq('device_id', deviceId);
    if (error && error.code !== '42P01') {
      console.warn('device_account_bindings role claim update:', error.message);
    }
    return;
  }
  const { error } = await supabase.from('device_account_bindings').insert({
    device_id: deviceId,
    role_app_claim: roleAppClaim,
    updated_at: new Date().toISOString(),
  });
  if (error && error.code !== '42P01') {
    console.warn('device_account_bindings role claim insert:', error.message);
  }
}

export function remoteRoleAppClaimBlocks(target: DeviceRoleAppClaim, binding: DeviceAccountBinding | null): boolean {
  if (!binding?.roleAppClaim) return false;
  return binding.roleAppClaim !== target;
}

export function mergeRemoteRoleAppClaim(binding: DeviceAccountBinding | null): DeviceRoleAppClaim | null {
  if (!binding?.roleAppClaim) return null;
  writeDeviceRoleAppClaim(binding.roleAppClaim);
  return binding.roleAppClaim;
}
