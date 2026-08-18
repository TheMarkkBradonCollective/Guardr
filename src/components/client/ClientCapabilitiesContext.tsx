import React, { createContext, useContext, useMemo } from 'react';
import type { ClientType } from '../../types';
import { normalizeClientType } from '../../lib/clientType';
import {
  clientHasCapability,
  clientHomeQuickActions,
  clientMaxGuardsPerRequest,
  clientMaxSavedLocations,
  clientOverflowNav,
  clientPostJobLabel,
  isClientViewAllowed,
  resolveAllowedClientView,
  type ClientCapability,
} from '../../lib/clientCapabilities';

const ClientAccountTypeContext = createContext<ClientType>('business');

export function ClientCapabilitiesProvider({
  clientType,
  children,
}: {
  clientType?: ClientType;
  children: React.ReactNode;
}) {
  const value = normalizeClientType(clientType);
  return <ClientAccountTypeContext.Provider value={value}>{children}</ClientAccountTypeContext.Provider>;
}

export function useClientAccountType(): ClientType {
  return useContext(ClientAccountTypeContext);
}

export function useClientCapabilities() {
  const clientType = useClientAccountType();
  return useMemo(
    () => ({
      clientType,
      isPersonal: clientType === 'personal',
      isBusiness: clientType === 'business',
      has: (capability: ClientCapability) => clientHasCapability(clientType, capability),
      maxGuardsPerRequest: clientMaxGuardsPerRequest(clientType),
      maxSavedLocations: clientMaxSavedLocations(clientType),
      overflowNav: clientOverflowNav(clientType),
      homeQuickActions: clientHomeQuickActions(clientType),
      postJobLabel: clientPostJobLabel(clientType),
      allowsView: (view: string) => isClientViewAllowed(view, clientType),
      resolveView: (view: string) => resolveAllowedClientView(view, clientType),
    }),
    [clientType]
  );
}
