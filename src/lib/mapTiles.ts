import type { PathOptions } from 'leaflet';
import { ThemeMode } from './platform/theme';

/** Carto basemap tiles matched to Guardr theme modes */
export function mapTileUrl(theme: ThemeMode): string {
  switch (theme) {
    case 'dark':
      return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    case 'grey':
      return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
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
      return { ring: '#6B8F6E', fill: '#6B8F6E', fillOpacity: 0.1 };
    case 'grey':
      return { ring: '#5E7B61', fill: '#5E7B61', fillOpacity: 0.14 };
    case 'light':
    default:
      return { ring: '#5E7B61', fill: '#5E7B61', fillOpacity: 0.12 };
  }
}

export function mapRoutePathOptions(theme: ThemeMode): {
  main: PathOptions;
  dash: PathOptions;
} {
  const sage = theme === 'dark' ? '#84a279' : '#5E7B61';
  const dashColor = theme === 'dark' ? '#ffffff' : theme === 'grey' ? '#f8faf8' : '#ffffff';
  return {
    main: {
      color: sage,
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
