import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { ThemeToggle } from '../ui/ThemeToggle';
import type { ThemeMode } from '../../lib/platform/theme';

export interface AccountMenuProps {
  userName: string;
  userSubtitle?: string;
  avatarUrl?: string;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
  /** Highlight avatar when profile is the active screen */
  active?: boolean;
}

export function AccountMenu({
  userName,
  userSubtitle,
  avatarUrl,
  themeMode,
  onChangeTheme,
  onOpenProfile,
  onSignOut,
  active = false,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  const handleProfile = () => {
    onOpenProfile();
    close();
  };

  const handleSignOut = () => {
    close();
    onSignOut();
  };

  return (
    <div ref={rootRef} className="account-menu relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`account-menu-trigger inline-flex items-center gap-1.5 rounded-full pl-1 pr-2 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
          active ? 'bg-brand-primary/10 ring-1 ring-brand-primary/30' : 'hover:bg-brand-border/20'
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label="Account menu"
      >
        <ProfileAvatar src={avatarUrl} name={userName} size="sm" />
        <ChevronDown
          className={`w-3.5 h-3.5 text-brand-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="account-menu-panel absolute right-0 top-[calc(100%+0.5rem)] z-[1200] w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-[var(--shadow-float)]"
        >
          <div className="px-4 py-3 border-b border-brand-border bg-brand-bg-sec/60">
            <p className="font-semibold text-sm truncate">{userName}</p>
            {userSubtitle && <p className="text-xs text-brand-text-muted truncate mt-0.5">{userSubtitle}</p>}
          </div>

          <div className="p-2 border-b border-brand-border">
            <button
              type="button"
              role="menuitem"
              onClick={handleProfile}
              className="account-menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-brand-text hover:bg-brand-bg-sec transition-colors"
            >
              <User className="w-4 h-4 shrink-0 text-brand-primary" strokeWidth={1.75} />
              Profile & settings
            </button>
          </div>

          <div className="px-4 py-3 border-b border-brand-border">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mb-2">Appearance</p>
            <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" className="w-full justify-center" />
          </div>

          <div className="p-2">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="account-menu-item account-menu-signout w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
