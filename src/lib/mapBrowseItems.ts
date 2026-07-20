import { SecurityRequest } from '../types';
import { GuardJobView } from './guardJobView';
import { formatShiftRange } from './dates';
import { formatCityLabel } from './californiaCities';
import type { MapBrowseChipVariant, MapBrowseDockItem } from '../components/map/MapBrowseDock';
import {
  clientMapPinKind,
  guardMapPinKind,
  staffMapPinKind,
} from './mapJobVisibility';

function jobLocation(req: Pick<SecurityRequest, 'state' | 'address' | 'location'>): string {
  return formatCityLabel(req.state) || req.address || req.location || 'Site';
}

const CLIENT_CHIP: Record<NonNullable<ReturnType<typeof clientMapPinKind>>, { label: string; variant: MapBrowseChipVariant }> = {
  open: { label: 'Open', variant: 'open' },
  pending: { label: 'Pending', variant: 'default' },
  upcoming: { label: 'Upcoming', variant: 'upcoming' },
  live: { label: 'Live', variant: 'live' },
};

const GUARD_CHIP: Record<NonNullable<ReturnType<typeof guardMapPinKind>>, { label: string; variant: MapBrowseChipVariant }> = {
  available: { label: 'Available', variant: 'available' },
  direct: { label: 'Request', variant: 'direct' },
  scheduled: { label: 'My job', variant: 'scheduled' },
};

const STAFF_CHIP: Record<NonNullable<ReturnType<typeof staffMapPinKind>>, { label: string; variant: MapBrowseChipVariant }> = {
  open: { label: 'Open', variant: 'open' },
  live: { label: 'Live', variant: 'live' },
  scheduled: { label: 'Scheduled', variant: 'scheduled' },
};

export function clientMapBrowseItems(jobs: SecurityRequest[]): MapBrowseDockItem[] {
  return jobs
    .map((job) => {
      const kind = clientMapPinKind(job);
      if (!kind) return null;
      const chip = CLIENT_CHIP[kind];
      return {
        id: job.id,
        title: job.title,
        location: jobLocation(job),
        schedule: formatShiftRange(job.startDate, job.endDate),
        chip: chip.label,
        chipVariant: chip.variant,
      };
    })
    .filter((item): item is MapBrowseDockItem => item !== null);
}

export function guardMapBrowseItems(guardId: string, jobs: GuardJobView[]): MapBrowseDockItem[] {
  return jobs
    .map((job): MapBrowseDockItem | null => {
      const kind = guardMapPinKind(guardId, job as SecurityRequest);
      if (!kind) return null;
      const chip = GUARD_CHIP[kind];
      return {
        id: job.id,
        title: job.title,
        location: jobLocation(job),
        schedule: formatShiftRange(job.startDate, job.endDate),
        chip: chip.label,
        chipVariant: chip.variant,
        ...(kind === 'direct' ? { flash: true } : {}),
      };
    })
    .filter((item): item is MapBrowseDockItem => item !== null);
}

export function staffMapBrowseItems(jobs: SecurityRequest[]): MapBrowseDockItem[] {
  return jobs
    .map((job) => {
      const kind = staffMapPinKind(job);
      if (!kind) return null;
      const chip = STAFF_CHIP[kind];
      return {
        id: job.id,
        title: job.title,
        location: jobLocation(job),
        schedule: formatShiftRange(job.startDate, job.endDate),
        chip: chip.label,
        chipVariant: chip.variant,
      };
    })
    .filter((item): item is MapBrowseDockItem => item !== null);
}
