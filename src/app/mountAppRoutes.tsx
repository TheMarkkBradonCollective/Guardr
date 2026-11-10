import type { ReactNode } from 'react';
import type { AppMountBindings } from './mountBindings';
import { renderAccountRoutes } from './account/Routes';
import { renderUnsupportedRole } from './fallback/Routes';
import { renderClientRoutes } from './client/Routes';
import { renderGuardRoutes } from './guard/Routes';
import { renderPublicRoutes } from './public/Routes';
import { renderStaffRoutes } from './staff/Routes';

/** Picks the same screen App rendered before the route files were extracted. */
export function mountAppRoutes(mount: AppMountBindings): ReactNode {
  return (
    renderPublicRoutes(mount) ??
    renderAccountRoutes(mount) ??
    renderGuardRoutes(mount) ??
    renderClientRoutes(mount) ??
    renderStaffRoutes(mount) ??
    renderUnsupportedRole(mount)
  );
}
