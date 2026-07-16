import {
  Building2,
  ClipboardCheck,
  Flame,
  HardHat,
  KeyRound,
  Music,
  PartyPopper,
  Shield,
  Sparkles,
  Star,
  Truck,
  UserCheck,
  Wine,
} from 'lucide-react';
import type { JobType } from '../../types';

export const JOB_TYPE_ICONS: Record<JobType, React.ComponentType<{ className?: string }>> = {
  'nightclub-bar': Wine,
  'event-wedding': Star,
  'event-concert': Music,
  'event-festival': PartyPopper,
  'event-corporate': Building2,
  'event-private': KeyRound,
  event: Sparkles,
  patrol: Truck,
  construction: HardHat,
  'fire-watch': Flame,
  'standing-guard': Shield,
  bodyguard: UserCheck,
  'armed-escort': Shield,
  'asset-protection': Building2,
  other: ClipboardCheck,
};
