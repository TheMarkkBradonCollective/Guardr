import React, { createContext, useContext, useMemo } from 'react';
import type { ProductRole } from '../../lib/productApps';

interface MessengerCompanionContextValue {
  active: boolean;
  role: ProductRole | null;
  unreadCount: number;
  openMainApp: () => void;
}

const MessengerCompanionContext = createContext<MessengerCompanionContextValue>({
  active: false,
  role: null,
  unreadCount: 0,
  openMainApp: () => {},
});

export function MessengerCompanionProvider({
  active,
  role,
  unreadCount = 0,
  onOpenMainApp,
  children,
}: {
  active: boolean;
  role: ProductRole | null;
  unreadCount?: number;
  onOpenMainApp: () => void;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      active,
      role,
      unreadCount,
      openMainApp: onOpenMainApp,
    }),
    [active, role, unreadCount, onOpenMainApp],
  );
  return (
    <MessengerCompanionContext.Provider value={value}>{children}</MessengerCompanionContext.Provider>
  );
}

export function useMessengerCompanion(): MessengerCompanionContextValue {
  return useContext(MessengerCompanionContext);
}
