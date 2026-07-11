import type { GeoCoords } from './geo';
import { Capacitor } from '@capacitor/core';

export interface GeoPosition {
  lat: number;
  lng: number;
}

export interface JobSiteLocationResult {
  coords: GeoCoords;
  addressLine: string | null;
  stateCode: string | null;
}

function geolocationErrorMessage(error: GeolocationPositionError): string {
  const settingsHint = Capacitor.isNativePlatform()
    ? 'Allow location access in your device Settings → Apps → Guardr → Permissions.'
    : 'Allow location access in your browser settings.';
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return `Location permission denied. ${settingsHint}`;
    case error.POSITION_UNAVAILABLE:
      return 'Current location is unavailable on this device.';
    case error.TIMEOUT:
      return 'Timed out getting your location. Try again.';
    default:
      return 'Unable to get your current location.';
  }
}

/** One-shot device GPS read (user gesture). */
export function requestDevicePosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not available on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(geolocationErrorMessage(err))),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

type NominatimReverse = {
  display_name?: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    'ISO3166-2-lvl4'?: string;
  };
};

function stateCodeFromReverse(address?: NominatimReverse['address']): string | null {
  const iso = address?.['ISO3166-2-lvl4'];
  if (iso?.startsWith('US-') && iso.length === 5) {
    return iso.slice(3);
  }
  return null;
}

function addressLineFromReverse(data: NominatimReverse): string | null {
  const parts = data.address;
  if (parts) {
    const street = [parts.house_number, parts.road].filter(Boolean).join(' ').trim();
    const city = parts.city || parts.town || parts.village;
    const line = [street, city, parts.state].filter(Boolean).join(', ');
    if (line.length > 4) return line;
  }
  const display = data.display_name?.trim();
  return display && display.length > 4 ? display : null;
}

export async function reverseGeocodeCoords(coords: GeoCoords): Promise<{
  addressLine: string | null;
  stateCode: string | null;
}> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return { addressLine: null, stateCode: null };
    const data = (await res.json()) as NominatimReverse;
    return {
      addressLine: addressLineFromReverse(data),
      stateCode: stateCodeFromReverse(data.address),
    };
  } catch {
    return { addressLine: null, stateCode: null };
  }
}

/** GPS + optional reverse geocode for job site entry. */
export async function locateCurrentJobSite(): Promise<JobSiteLocationResult> {
  const coords = await requestDevicePosition();
  const { addressLine, stateCode } = await reverseGeocodeCoords(coords);
  return { coords, addressLine, stateCode };
}
