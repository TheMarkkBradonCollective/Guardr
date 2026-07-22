import type { PathOptions } from 'leaflet';
import { ThemeMode } from './platform/theme';

/** Carto basemap tiles matched to Guardr theme modes */
export function mapTileUrl(theme: ThemeMode): string {
  switch (theme) {
    case 'dark':
      return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    case 'light':
    default:
      return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  }
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
