import type { Certification } from '../../types';
import { getCertificationRevisionTimeline } from '../../lib/certRevisionHistory';
import { CredentialRecordsList } from './CredentialRecordsList';

interface CredentialRevisionTimelineProps {
  cert: Certification;
}

export function CredentialRevisionTimeline({ cert }: CredentialRevisionTimelineProps) {
  return <CredentialRecordsList items={getCertificationRevisionTimeline(cert)} />;
}
