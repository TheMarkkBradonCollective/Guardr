import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { Plus } from 'lucide-react';
import type { SurfacePrimaryAction as SidebarPrimaryAction } from '../../surfaces/surfaceShellTypes';
import type { StaffSection } from '../../lib/staffOps';

export type StaffCreateActionKey =
  | 'job'
  | 'client'
  | 'guard'
  | 'staff'
  | 'credential'
  | 'location';

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
    case 'locations':
      return 'location';
    default:
      return null;
  }
}

export const STAFF_CREATE_ACTION_LABELS: Record<StaffCreateActionKey, string> = {
  job: 'Create job',
  client: 'Add client',
  guard: 'Add guard',
  staff: 'Add staff',
  credential: 'Add credential',
  location: 'Add location',
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
  const actions = useStaffSidebarPrimaryActions(section, {
    canCreateJob: section === 'jobs' && enabled,
    canAddClient: section === 'clients' && enabled,
    canAddGuard: section === 'guards' && enabled,
    canAddStaff: section === 'team' && enabled,
  });
  return actions[0];
}

export function useStaffSidebarPrimaryActions(
  section: StaffSection,
  options: {
    canCreateJob?: boolean;
    canAddClient?: boolean;
    canAddGuard?: boolean;
    canAddStaff?: boolean;
    canAddCredential?: boolean;
    canAddLocation?: boolean;
  },
): SidebarPrimaryAction[] {
  const { trigger } = useStaffShellCreate();

  return useMemo(() => {
    if (section === 'applications') {
      const actions: SidebarPrimaryAction[] = [];
      if (options.canAddGuard) {
        actions.push({
          label: STAFF_CREATE_ACTION_LABELS.guard,
          icon: <Plus size={16} strokeWidth={2.5} aria-hidden />,
          onClick: () => trigger('guard'),
        });
      }
      if (options.canAddClient) {
        actions.push({
          label: STAFF_CREATE_ACTION_LABELS.client,
          icon: <Plus size={16} strokeWidth={2.5} aria-hidden />,
          onClick: () => trigger('client'),
        });
      }
      return actions;
    }

    if (section === 'credentials' && options.canAddCredential) {
      return [
        {
          label: STAFF_CREATE_ACTION_LABELS.credential,
          icon: <Plus size={16} strokeWidth={2.5} aria-hidden />,
          onClick: () => trigger('credential'),
        },
      ];
    }

    const actionKey = staffSectionCreateAction(section);
    if (!actionKey) return [];

    const enabled =
      (section === 'jobs' && options.canCreateJob) ||
      (section === 'clients' && options.canAddClient) ||
      (section === 'guards' && options.canAddGuard) ||
      (section === 'team' && options.canAddStaff) ||
      (section === 'locations' && options.canAddLocation);

    if (!enabled) return [];

    return [
      {
        label: STAFF_CREATE_ACTION_LABELS[actionKey],
        icon: <Plus size={16} strokeWidth={2.5} aria-hidden />,
        onClick: () => trigger(actionKey),
      },
    ];
  }, [
    section,
    options.canAddClient,
    options.canAddCredential,
    options.canAddLocation,
    options.canAddGuard,
    options.canCreateJob,
    options.canAddStaff,
    trigger,
  ]);
}
