import { useCallback, useState } from 'react';
import { useDevice } from '../../lib/platform';
import {
  type StaffCreateActionKey,
  useStaffShellCreateRegistration,
} from './StaffShellCreateContext';

/** Shared open state for staff create forms — registers with sidebar CTA on desktop. */
export function useStaffCreateFormOpen(
  actionKey: StaffCreateActionKey | null | undefined,
  options?: { showInlineTriggerOnDesktop?: boolean },
) {
  const [open, setOpen] = useState(false);
  const { formFactor } = useDevice();
  const hideTrigger = formFactor === 'desktop' && !options?.showInlineTriggerOnDesktop;

  const requestOpen = useCallback(() => setOpen(true), []);
  useStaffShellCreateRegistration(actionKey, requestOpen);

  return { open, setOpen, hideTrigger };
}
