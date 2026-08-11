import { apiUrl } from './siteConfig';

/** Public print-ready PDF manuals served from /manuals/*.pdf */

export type UserManualAudience = 'client' | 'guard' | 'staff' | 'all';

export type UserManualId =
  | 'quick-start'
  | 'client'
  | 'guard'
  | 'staff'
  | 'combined';

export interface UserManualFile {
  id: UserManualId;
  title: string;
  description: string;
  fileName: string;
  /** Site-root path (web). Use {@link resolveManualPdfUrl} for APK/PWA. */
  href: string;
  /** Who the manual is primarily for */
  forAudiences: UserManualAudience[];
}

export const USER_MANUALS_BASE_PATH = '/manuals';

export const USER_MANUALS: UserManualFile[] = [
  {
    id: 'quick-start',
    title: 'Quick Start',
    description: 'Three doors — client, guard, or Apply to work at Guardr.',
    fileName: 'Guardr-Quick-Start.pdf',
    href: `${USER_MANUALS_BASE_PATH}/Guardr-Quick-Start.pdf`,
    forAudiences: ['all', 'client', 'guard', 'staff'],
  },
  {
    id: 'client',
    title: 'Client User Manual',
    description: 'Post jobs, hire, pay, confirm coverage, and invoices.',
    fileName: 'Guardr-Client-User-Manual.pdf',
    href: `${USER_MANUALS_BASE_PATH}/Guardr-Client-User-Manual.pdf`,
    forAudiences: ['all', 'client', 'staff'],
  },
  {
    id: 'guard',
    title: 'Guard User Manual',
    description: 'Credentials, marketplace jobs, shifts, and payouts.',
    fileName: 'Guardr-Guard-User-Manual.pdf',
    href: `${USER_MANUALS_BASE_PATH}/Guardr-Guard-User-Manual.pdf`,
    forAudiences: ['all', 'guard', 'staff'],
  },
  {
    id: 'staff',
    title: 'Staff Ops Manual',
    description: 'Support through Founder — hiring, verification, and ops.',
    fileName: 'Guardr-Staff-Ops-Manual.pdf',
    href: `${USER_MANUALS_BASE_PATH}/Guardr-Staff-Ops-Manual.pdf`,
    forAudiences: ['all', 'staff'],
  },
  {
    id: 'combined',
    title: 'All manuals (combined)',
    description: 'Single PDF binder with every role manual.',
    fileName: 'Guardr-User-Manuals-Combined.pdf',
    href: `${USER_MANUALS_BASE_PATH}/Guardr-User-Manuals-Combined.pdf`,
    forAudiences: ['all', 'staff'],
  },
];

/** Combined binder — used when a single PDF link is needed (e.g. landing). */
export const USER_MANUALS_COMBINED_HREF = `${USER_MANUALS_BASE_PATH}/Guardr-User-Manuals-Combined.pdf`;

/**
 * Absolute PDF URL on web and native.
 * Capacitor WebView origin is not guardr.co — must use the live site host.
 */
export function resolveManualPdfUrl(hrefOrFileName: string): string {
  const path = hrefOrFileName.startsWith('/')
    ? hrefOrFileName
    : `${USER_MANUALS_BASE_PATH}/${hrefOrFileName.replace(/^\/+/, '')}`;
  return apiUrl(path);
}

/** Map Guide filter tabs / platform roles onto manual audiences. */
export function resolveManualAudience(
  filter?: string | null,
): UserManualAudience {
  switch (filter) {
    case 'client':
      return 'client';
    case 'guard':
      return 'guard';
    case 'support':
    case 'moderator':
    case 'administrator':
    case 'manager':
    case 'director':
    case 'founder':
    case 'owner':
    case 'staff':
      return 'staff';
    default:
      return 'all';
  }
}

export function manualsForAudience(audience: UserManualAudience): UserManualFile[] {
  return USER_MANUALS.filter((manual) => manual.forAudiences.includes(audience));
}

/** Audience for the signed-in platform role. */
export function manualsForPlatformRole(role?: string | null): UserManualFile[] {
  return manualsForAudience(resolveManualAudience(role));
}
