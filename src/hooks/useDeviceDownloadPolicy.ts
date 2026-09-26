import { useEffect, useState } from 'react';
import { resolveDeviceId } from '../lib/deviceIdentity';
import {
  fetchDeviceAccountBinding,
  mergeRemoteRoleAppClaim,
  remoteRoleAppClaimBlocks,
} from '../lib/deviceBindingStore';
import {
  canDownloadRoleProductBundle,
  canInstallRoleProductApp,
  readDeviceRoleAppClaim,
  type DeviceRoleAppClaim,
} from '../lib/deviceRoleClaim';

export function useDeviceDownloadPolicy() {
  const [ready, setReady] = useState(false);
  const [claim, setClaim] = useState<DeviceRoleAppClaim | null>(() => readDeviceRoleAppClaim());

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const deviceId = await resolveDeviceId();
        const remote = await fetchDeviceAccountBinding(deviceId);
        const merged = mergeRemoteRoleAppClaim(remote) ?? readDeviceRoleAppClaim();
        if (!cancelled) setClaim(merged);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ready,
    roleAppClaim: claim,
    canInstallRoleApp: (target: DeviceRoleAppClaim) => {
      if (!canInstallRoleProductApp(target)) return false;
      if (claim && claim !== target) return false;
      return true;
    },
    canDownloadAllApksZip: () => canDownloadRoleProductBundle() && !claim,
    blockedReason:
      claim != null
        ? 'This device is registered for one Guardr role app. Messenger is still available.'
        : null,
  };
}

export { remoteRoleAppClaimBlocks };
