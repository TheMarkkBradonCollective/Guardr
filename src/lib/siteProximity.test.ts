import test from 'node:test';
import assert from 'node:assert/strict';
import {
  distanceMeters,
  isWithinSiteRadius,
  ON_SITE_RADIUS_METERS,
  jobHasSiteCoordinates,
} from './siteProximity';

test('distanceMeters returns ~0 for identical points', () => {
  const dist = distanceMeters({ lat: 34.05, lng: -118.25 }, { lat: 34.05, lng: -118.25 });
  assert.ok(dist < 1);
});

test('isWithinSiteRadius uses 150m default', () => {
  const job = { latitude: 34.05, longitude: -118.25 };
  assert.equal(jobHasSiteCoordinates(job), true);
  assert.equal(isWithinSiteRadius({ lat: 34.05, lng: -118.25 }, job), true);
  // ~220m north
  assert.equal(
    isWithinSiteRadius({ lat: 34.052, lng: -118.25 }, job, ON_SITE_RADIUS_METERS),
    false
  );
});
