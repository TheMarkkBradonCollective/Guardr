import React, { useMemo, useState } from 'react';
import { ShiftMap } from '../../components/guard/ShiftMap';
import { MapBrowseDock } from '../../components/map/MapBrowseDock';
import { MapSelectionExperience } from '../../components/map/MapSelectionExperience';
import { staffMapBrowseItems } from '../../lib/mapBrowseItems';
import { STAFF_MAP_BROWSE_EMPTY_MESSAGE } from '../../lib/mapEmptyMessages';
import type { SecurityRequest } from '../../types';
import { PREVIEW_JOB } from '../previewStaffFixtures';
import { previewScreenState } from '../previewScreenState';

const MAP_JOBS: SecurityRequest[] = [
  {
    ...PREVIEW_JOB,
    latitude: 38.5816,
    longitude: -121.4944,
  },
  {
    ...PREVIEW_JOB,
    id: 'JOB-4901238031',
    title: 'Harbor Logistics — Gate 2',
    location: 'West Sacramento',
    address: '210 Harbor Blvd, West Sacramento, CA',
    latitude: 38.5805,
    longitude: -121.5303,
    hourlyRate: 24,
    estimatedPayout: 192,
  },
];

/** Real map chrome against fixture pins. No live session required. */
export function MapPreviewScreen() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      'guardr_map_viewport',
      JSON.stringify({ lat: 38.5816, lng: -121.4944, zoom: 12 }),
    );
  }
  const state = previewScreenState();
  const jobs = state === 'ready' ? MAP_JOBS : [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => jobs.find((job) => job.id === selectedId) ?? null, [jobs, selectedId]);

  return (
    <div className="h-full min-h-0 relative overflow-hidden staff-map-layout map-preview">
      {state === 'error' ? (
        <p className="map-preview-error" role="alert">
          Couldn&apos;t load jobs for this map.
        </p>
      ) : null}
      <ShiftMap
        jobs={jobs}
        selectedJobId={selectedId}
        onSelectJob={setSelectedId}
        pinMode="staff"
        drawRoute={false}
      />
      <MapSelectionExperience
        job={selected}
        role="staff"
        route={null}
        onClose={() => setSelectedId(null)}
        onPrimaryAction={() => undefined}
        primaryLabel="Review job"
      />
      <MapBrowseDock
        items={staffMapBrowseItems(jobs)}
        selectedId={selectedId}
        onSelect={setSelectedId}
        emptyMessage={
          state === 'error' ? "Jobs didn't load, so the map is empty." : STAFF_MAP_BROWSE_EMPTY_MESSAGE
        }
      />
    </div>
  );
}
