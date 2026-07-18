import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { Plus } from 'lucide-react';
import type { SidebarPrimaryAction } from '../baseui/layout/GuardrDrawerShell';
import type { StaffSection } from '../../lib/staffOps';

export type StaffCreateActionKey = 'job' | 'client' | 'guard' | 'staff';

export function staffSectionCreateAction(section: StaffSection): StaffCreateActionKey | null {
  switch (section) {
    case 'jobs':
      return 'job';
    case 'clients':
      return 'client';
    case 'guards':
      return 'guard';
    case 'team':
      return 'staff';
    default:
      return null;
  }
}

export const STAFF_CREATE_ACTION_LABELS: Record<StaffCreateActionKey, string> = {
  job: '+ Create job',
  client: '+ Add client',
  guard: '+ Add guard',
  staff: '+ Add staff',
};

type StaffShellCreateContextValue = {
  registerOpener: (key: StaffCreateActionKey, opener: () => void) => () => void;
  trigger: (key: StaffCreateActionKey) => void;
};

const StaffShellCreateContext = createContext<StaffShellCreateContextValue | null>(null);

export function StaffShellCreateProvider({ children }: { children: React.ReactNode }) {
  const openersRef = useRef<Partial<Record<StaffCreateActionKey, () => void>>>({});

  const registerOpener = useCallback((key: StaffCreateActionKey, opener: () => void) => {
    openersRef.current[key] = opener;
    return () => {
      if (openersRef.current[key] === opener) {
        delete openersRef.current[key];
      }
    };
  }, []);

  const trigger = useCallback((key: StaffCreateActionKey) => {
    openersRef.current[key]?.();
  }, []);

  const value = useMemo(() => ({ registerOpener, trigger }), [registerOpener, trigger]);

  return <StaffShellCreateContext.Provider value={value}>{children}</StaffShellCreateContext.Provider>;
}

export function useStaffShellCreate() {
  const ctx = useContext(StaffShellCreateContext);
  if (!ctx) {
    throw new Error('useStaffShellCreate must be used within StaffShellCreateProvider');
  }
  return ctx;
}

/** Register a page-level create form so the sidebar CTA can open it. */
export function useStaffShellCreateRegistration(
  key: StaffCreateActionKey | null | undefined,
  onOpen: () => void,
) {
  const { registerOpener } = useStaffShellCreate();
  useEffect(() => {
    if (!key) return;
    return registerOpener(key, onOpen);
  }, [key, onOpen, registerOpener]);
}

export function useStaffSidebarPrimaryAction(
  section: StaffSection,
  enabled: boolean,
): SidebarPrimaryAction | undefined {
  const { trigger } = useStaffShellCreate();
  const actionKey = staffSectionCreateAction(section);

  return useMemo(() => {
    if (!enabled || !actionKey) return undefined;
    return {
      label: STAFF_CREATE_ACTION_LABELS[actionKey],
      icon: <Plus size={16} strokeWidth={2.5} aria-hidden />,
      onClick: () => trigger(actionKey),
    };
  }, [enabled, actionKey, trigger]);
}
