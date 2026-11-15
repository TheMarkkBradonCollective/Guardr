import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { estimateJobDistanceMiles, jobDistanceMiles, locationToCoords, METRO_CENTER } from './geo.ts';
import { getJobDistance, sortJobs } from './guardJobs.ts';
import { DEFAULT_CALIFORNIA_CITY, resolveJobCity } from './californiaCities.ts';
import { SACRAMENTO_CENTER } from './mapInitialCenter.ts';

const sacJob = { id: 'j1', location: 'Capitol Mall', latitude: 38.5765, longitude: -121.5012 };
const nearSac = { lat: 38.58, lng: -121.49 };

describe('job distance without a device location', () => {
  it('shows no distance when the device location is unknown', () => {
    assert.equal(getJobDistance(sacJob, null), null);
    assert.equal(estimateJobDistanceMiles('x', 'y', null, { lat: 38.5, lng: -121.4 }), null);
    assert.equal(estimateJobDistanceMiles('x', 'y', undefined), null);
    assert.equal(jobDistanceMiles(sacJob, undefined), null);
    assert.equal(jobDistanceMiles(sacJob, { lat: 0, lng: 0 }), null);
  });

  it('defaults to the last known device fix, which is absent off-device', () => {
    // node has no localStorage, so the default origin is "unknown" — not a default city.
    assert.equal(getJobDistance(sacJob), null);
  });

  it('measures from the real device location when known', () => {
    const miles = getJobDistance(sacJob, nearSac);
    assert.ok(miles != null && miles < 2, String(miles));
  });

  it('a Sacramento job is never ~360 mi away (the old Los Angeles origin)', () => {
    assert.ok((jobDistanceMiles(sacJob, METRO_CENTER) ?? 999) < 2);
  });

  it('distance sort keeps jobs without a distance last', () => {
    const jobs = [{ ...sacJob, id: 'a' }, { ...sacJob, id: 'b', latitude: undefined, longitude: undefined }];
    assert.deepEqual(sortJobs(jobs as never, 'distance').map((j: { id: string }) => j.id), ['a', 'b']);
  });
});

describe('Sacramento is the only default point', () => {
  it('legacy jobs without coordinates are placed around Sacramento', () => {
    assert.deepEqual(METRO_CENTER, { lat: SACRAMENTO_CENTER.lat, lng: SACRAMENTO_CENTER.lng });
    const p = locationToCoords('Somewhere', 'legacy-1');
    assert.ok(Math.abs(p.lat - 38.58) < 0.1 && Math.abs(p.lng + 121.49) < 0.1, JSON.stringify(p));
  });

  it('default work city is Sacramento', () => {
    assert.equal(DEFAULT_CALIFORNIA_CITY, 'Sacramento');
    assert.equal(resolveJobCity('CA'), 'Sacramento');
  });

  it('no Los Angeles coordinates remain in app source', () => {
    for (const f of ['geo.ts', 'tutorialDemoData.ts', 'guardJobs.ts', 'mapInitialCenter.ts', '../components/jobs/JobLocationCoordsFields.tsx', '../components/guard/ShiftMap.tsx']) {
      const src = readFileSync(new URL(f, import.meta.url), 'utf8');
      assert.doesNotMatch(src, /34\.05|-118\.24/, f);
    }
  });
});
