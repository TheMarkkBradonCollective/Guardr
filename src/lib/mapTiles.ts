import type { PathOptions } from 'leaflet';
import { ThemeMode } from './platform/theme';

/**
 * Public Esri World Street Map tiles — no API key.
 *
 * CARTO raster basemaps (`basemaps.cartocdn.com`) now stamp every unauthenticated
 * request with an "API KEY REQUIRED" watermark. Esri's public tiled services do
 * not. Dark vs light is applied in CSS on `.leaflet-tile-pane` (invert + grade)
 * so both themes share one labeled street layer at full zoom.
 *
 * Note the Esri XYZ order is `{z}/{y}/{x}`.
 */
export const ESRI_WORLD_STREET_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

export const MAP_TILE_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Source: Esri, OpenStreetMap';

export const MAP_TILE_MAX_ZOOM = 19;

/** Basemap tiles. Theme is applied in CSS; the URL is the same in both modes. */
export function mapTileUrl(_theme: ThemeMode): string {
  return ESRI_WORLD_STREET_TILE_URL;
}

export function mapUserLocationColors(theme: ThemeMode): {
  ring: string;
  fill: string;
  fillOpacity: number;
} {
  switch (theme) {
    case 'dark':
      return { ring: '#FFFFFF', fill: '#FFFFFF', fillOpacity: 0.1 };
    case 'light':
    default:
      return { ring: '#000000', fill: '#000000', fillOpacity: 0.12 };
  }
}

export function mapRoutePathOptions(theme: ThemeMode): {
  main: PathOptions;
  dash: PathOptions;
} {
  const routeColor = theme === 'dark' ? '#FFFFFF' : '#000000';
  const dashColor = theme === 'dark' ? '#000000' : '#FFFFFF';
  return {
    main: {
      color: routeColor,
      weight: 5,
      opacity: theme === 'dark' ? 0.92 : 0.88,
      lineCap: 'round',
      lineJoin: 'round',
    },
    dash: {
      color: dashColor,
      weight: 2,
      opacity: theme === 'dark' ? 0.35 : 0.5,
      dashArray: '6 10',
      lineCap: 'round',
    },
  };
}
