import React from 'react';
import { SecurityGuard } from '../../types';

interface GuardCredentialGraceBannerProps {
  guard: SecurityGuard;
  onOpenCredentials?: () => void;
}

/** Grace periods are internal — never surfaced to guards. */
export function GuardCredentialGraceBanner(_props: GuardCredentialGraceBannerProps) {
  return null;
}
