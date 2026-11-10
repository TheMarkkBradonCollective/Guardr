/**
 * renderUnsupportedRole — behaviour-neutral route mount moved out of App.tsx.
 * Page workstreams edit this module instead of App.tsx.
 */
import type { ReactNode } from 'react';
import { AccountMenu } from '../../components/layouts/AccountMenu';
import type { AppMountBindings } from '../mountBindings';

export function renderUnsupportedRole(mount: AppMountBindings): ReactNode | null {
  const currentUser = mount.currentUser;
  if (!currentUser) return null;
  const {
    accountMenuExtras,
    handleSignOut,
  } = mount;


  return (
    <div className="page-shell min-h-screen flex flex-col bg-brand-bg">
      <header className="flex justify-end items-center gap-2 px-5 pt-[max(1rem,env(safe-area-inset-top))] shrink-0">
        <AccountMenu
          userName={currentUser.name}
          userSubtitle={currentUser.email}
          avatarUrl={currentUser.avatar}
          onOpenProfile={() => undefined}
          onOpenSettings={() => undefined}
          onSignOut={handleSignOut}
          hideProfile
          {...accountMenuExtras}
        />
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
        <p className="text-brand-text font-semibold">This account role is not supported.</p>
        <p className="text-brand-text-muted text-sm max-w-sm">
          Sign out and sign in again with a Guardr client, guard, or staff account.
        </p>
      </div>
    </div>
  );
}
