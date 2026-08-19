import { useCallback, useState } from 'react';
import {
  type StaffCreateActionKey,
  useStaffShellCreateRegistration,
} from './StaffShellCreateContext';

/** Shared open state for staff create forms. */
export function useStaffCreateFormOpen(
  actionKey: StaffCreateActionKey | null | undefined,
  _options?: { showInlineTriggerOnDesktop?: boolean },
) {
  const [open, setOpen] = useState(false);

  const requestOpen = useCallback(() => setOpen(true), []);
  useStaffShellCreateRegistration(actionKey, requestOpen);

  return { open, setOpen, hideTrigger: false };
}
