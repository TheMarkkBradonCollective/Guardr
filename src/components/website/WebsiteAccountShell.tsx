import React from 'react';
import {
  ArrowLeft,
  CreditCard,
  FileText,
  LifeBuoy,
  LogOut,
  Settings,
  Shield,
  UserRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from '../Logo';
import { AccountMenu, type AccountMenuProps } from '../layouts/AccountMenu';
import { AppButton } from '../ui/AppButton';
import {
  PRODUCT_APP_LABELS,
  websiteAccountViewsForRole,
  type ProductRole,
  type WebsiteAccountView,
} from '../../lib/productApps';
import { OpenAppCta } from '../apps/OpenAppCta';
import type { ThemeMode } from '../../lib/platform/theme';

const VIEW_ICONS: Record<WebsiteAccountView, LucideIcon> = {
  home: Shield,
  profile: UserRound,
  billing: CreditCard,
  payouts: Wallet,
  settings: Settings,
  support: LifeBuoy,
  documents: FileText,
};

interface WebsiteAccountShellProps {
  role: ProductRole;
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  activeView: WebsiteAccountView;
  onNavigate: (view: WebsiteAccountView) => void;
  onOpenApp: () => void;
  onSignOut: () => void;
  onBackToSite?: () => void;
  accountMenu: AccountMenuProps;
  themeMode?: ThemeMode;
  children: React.ReactNode;
}

export function WebsiteAccountShell({
  role,
  userName,
  userEmail,
  activeView,
  onNavigate,
  onOpenApp,
  onSignOut,
  onBackToSite,
  accountMenu,
  children,
}: WebsiteAccountShellProps) {
  const nav = websiteAccountViewsForRole(role);
  const appLabel = PRODUCT_APP_LABELS[role === 'client' ? 'client' : role === 'guard' ? 'guard' : 'staff'];

  return (
    <div className="website-account" data-product-app="website">
      <header className="website-account-top">
        <div className="website-account-top-inner">
          <div className="website-account-brand">
            {onBackToSite ? (
              <button type="button" className="website-account-back" onClick={onBackToSite}>
                <ArrowLeft size={18} strokeWidth={2.25} aria-hidden />
                <span>Guardr</span>
              </button>
            ) : (
              <a href="/" className="website-account-logo">
                <Logo size={22} variant="wordmark" />
              </a>
            )}
            <span className="website-account-env">Account</span>
          </div>
          <div className="website-account-top-actions">
            <AppButton variant="primary" size="sm" onClick={onOpenApp}>
              {role === 'staff' ? 'Open operations' : `Open ${appLabel}`}
            </AppButton>
            <AccountMenu {...accountMenu} triggerVariant="uber-direct" />
          </div>
        </div>
      </header>

      <div className="website-account-body">
        <aside className="website-account-nav" aria-label="Account">
          <p className="website-account-user">
            <span className="website-account-user-name">{userName}</span>
            <span className="website-account-user-email">{userEmail}</span>
          </p>
          <nav>
            {nav.map((item) => {
              const Icon = VIEW_ICONS[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`website-account-nav-item${activeView === item.id ? ' is-active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                  aria-current={activeView === item.id ? 'page' : undefined}
                >
                  <Icon size={18} strokeWidth={2} aria-hidden />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <button type="button" className="website-account-nav-item website-account-signout" onClick={onSignOut}>
            <LogOut size={18} strokeWidth={2} aria-hidden />
            Sign out
          </button>
        </aside>

        <main className="website-account-main">
          {children}
          {activeView !== 'home' && role !== 'staff' ? (
            <div className="website-account-app-slot website-account-app-slot--quiet">
              <OpenAppCta role={role} compact onOpenWebApp={onOpenApp} />
            </div>
          ) : null}
        </main>
      </div>

      <nav className="website-account-mobile-nav" aria-label="Account sections">
        {nav.slice(0, 5).map((item) => {
          const Icon = VIEW_ICONS[item.id];
          return (
            <button
              key={item.id}
              type="button"
              className={activeView === item.id ? 'is-active' : undefined}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={20} strokeWidth={2} aria-hidden />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
