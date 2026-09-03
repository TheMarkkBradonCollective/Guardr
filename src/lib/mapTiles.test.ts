import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ESRI_WORLD_STREET_TILE_URL,
  MAP_TILE_ATTRIBUTION,
  MAP_TILE_MAX_ZOOM,
  mapRoutePathOptions,
  mapTileUrl,
  mapUserLocationColors,
} from './mapTiles.ts';

describe('mapTiles', () => {
  it('uses key-free Esri street tiles in both themes', () => {
    assert.equal(mapTileUrl('light'), ESRI_WORLD_STREET_TILE_URL);
    assert.equal(mapTileUrl('dark'), ESRI_WORLD_STREET_TILE_URL);
    assert.match(mapTileUrl('light'), /arcgisonline\.com/);
    assert.doesNotMatch(mapTileUrl('light'), /cartocdn|carto\.com/i);
    assert.doesNotMatch(mapTileUrl('light'), /apikey|api_key|key=/i);
    assert.match(mapTileUrl('light'), /\{z\}\/\{y\}\/\{x\}/);
  });

  it('keeps attribution and a street-level max zoom', () => {
    assert.match(MAP_TILE_ATTRIBUTION, /Esri/);
    assert.ok(MAP_TILE_MAX_ZOOM >= 18);
  });

  it('keeps user-location and route colors theme-aware', () => {
    assert.equal(mapUserLocationColors('dark').ring, '#FFFFFF');
    assert.equal(mapUserLocationColors('light').ring, '#000000');
    assert.equal(mapRoutePathOptions('dark').main.color, '#FFFFFF');
    assert.equal(mapRoutePathOptions('light').main.color, '#000000');
  });
});
