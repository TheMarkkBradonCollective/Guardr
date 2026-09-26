import { PRODUCT_APP_LABELS, PRODUCT_APP_TAGLINES, type ProductApp } from './productApps';
import { MESSENGER_APP_LABEL } from './messengerCompanion';

export type PwaManifestId = ProductApp | 'messenger';

export interface PwaManifestDescriptor {
  id: PwaManifestId;
  href: string;
  name: string;
  shortName: string;
  startUrl: string;
  scope: string;
  themeColor: string;
  backgroundColor: string;
}

export const PWA_MANIFESTS: Record<PwaManifestId, PwaManifestDescriptor> = {
  website: {
    id: 'website',
    href: '/manifest.json',
    name: PRODUCT_APP_LABELS.website,
    shortName: 'Guardr',
    startUrl: '/',
    scope: '/',
    themeColor: '#000000',
    backgroundColor: '#000000',
  },
  client: {
    id: 'client',
    href: '/manifests/client.webmanifest',
    name: 'Guardr Customer',
    shortName: 'Customer',
    startUrl: '/client/home',
    scope: '/client/',
    themeColor: '#000000',
    backgroundColor: '#000000',
  },
  guard: {
    id: 'guard',
    href: '/manifests/guard.webmanifest',
    name: 'Guardr Guard',
    shortName: 'Guard',
    startUrl: '/guard/map',
    scope: '/guard/',
    themeColor: '#000000',
    backgroundColor: '#000000',
  },
  staff: {
    id: 'staff',
    href: '/manifests/staff.webmanifest',
    name: 'Guardr Staff',
    shortName: 'Staff',
    startUrl: '/staff/overview',
    scope: '/staff/',
    themeColor: '#000000',
    backgroundColor: '#000000',
  },
  messenger: {
    id: 'messenger',
    href: '/manifests/messenger.webmanifest',
    name: 'Guardr Messenger',
    shortName: MESSENGER_APP_LABEL,
    startUrl: '/messenger',
    scope: '/messenger',
    themeColor: '#000000',
    backgroundColor: '#000000',
  },
};

export function pwaIconSet(id: PwaManifestId): { any192: string; any512: string; maskable512: string } {
  if (id === 'website') {
    return {
      any192: '/icon-192.png',
      any512: '/icon-512.png',
      maskable512: '/icon-maskable-512.png',
    };
  }
  return {
    any192: `/icons/${id}-192.png`,
    any512: `/icons/${id}-512.png`,
    maskable512: `/icons/${id}-maskable-512.png`,
  };
}

/**
 * Single installable PWA (`/manifest.json`, scope `/`).
 * Role is chosen at sign-in — not separate home-screen apps per role.
 */
export function pwaManifestIdFromLocation(
  _url: string,
  _productApp: ProductApp,
): PwaManifestId {
  return 'website';
}

export function applyPwaManifestLink(manifest: PwaManifestDescriptor): void {
  if (typeof document === 'undefined') return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'manifest';
    document.head.appendChild(link);
  }
  if (link.getAttribute('href') !== manifest.href) {
    link.setAttribute('href', manifest.href);
  }

  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute('content', manifest.themeColor);
  });
  document.documentElement.dataset.pwaApp = manifest.id;
}

export function applyPwaManifestForLocation(url: string, productApp: ProductApp): PwaManifestId {
  const id = pwaManifestIdFromLocation(url, productApp);
  applyPwaManifestLink(PWA_MANIFESTS[id]);
  return id;
}

export function pwaInstallCopy(_id: PwaManifestId = 'website'): { title: string; body: string } {
  return {
    title: 'Install Guardr',
    body:
      'One home-screen app for the whole platform — sign in as Customer, Guard, or Staff. ' +
      'Field tools run here when installed; use role APKs on Android for the strongest native experience.',
  };
}
