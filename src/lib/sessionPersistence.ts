/**
 * Drop a cached local session only after a successful roster load that
 * proves the account is gone. Failed / timed-out loads must not log the user out.
 */
export function shouldDropStaleSession(input: {
  loading: boolean;
  isDbConnected: boolean;
  rostersHydrated: boolean;
  userExistsInRosters: boolean;
}): boolean {
  if (input.loading) return false;
  if (!input.isDbConnected || !input.rostersHydrated) return false;
  return !input.userExistsInRosters;
}
