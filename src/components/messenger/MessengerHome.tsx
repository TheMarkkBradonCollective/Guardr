import React from 'react';
import { Capacitor } from '@capacitor/core';
import { Download, MessageCircle } from 'lucide-react';
import { Logo } from '../Logo';
import {
  NATIVE_APPLICATION_IDS,
  NATIVE_URL_SCHEMES,
  defaultOperationalPathForRole,
  installPathForApp,
  nativeDeepLinkForRole,
  type ProductRole,
} from '../../lib/productApps';
import { SITE_URL } from '../../lib/siteConfig';
import { ONE_ROLE_POLICY_TITLE } from '../../lib/oneRolePolicy';
import '../../styles/messenger-home.css';

const ROLE_LINKS: { role: ProductRole; label: string; tagline: string }[] = [
  { role: 'guard', label: 'Guard', tagline: 'Shifts, check-in, and field work' },
  { role: 'client', label: 'Customer', tagline: 'Coverage, activity, and reports' },
  { role: 'staff', label: 'Staff', tagline: 'Operations, people, and administration' },
];

function androidIntentUrl(role: ProductRole): string {
  const dest = defaultOperationalPathForRole(role);
  const prefix = role === 'client' ? '/client' : role === 'guard' ? '/guard' : '/staff';
  const rest = dest.startsWith(prefix) ? dest.slice(prefix.length).replace(/^\//, '') : dest.replace(/^\//, '');
  const scheme = NATIVE_URL_SCHEMES[role];
  const pkg = NATIVE_APPLICATION_IDS[role];
  return `intent://${rest}#Intent;scheme=${scheme};package=${pkg};S.browser_fallback_url=${encodeURIComponent(`${SITE_URL}${installPathForApp(role)}`)};end`;
}

function openRoleApp(role: ProductRole) {
  const fallback = `${SITE_URL}${installPathForApp(role)}`;
  if (Capacitor.getPlatform() === 'android') {
    window.location.href = androidIntentUrl(role);
    return;
  }
  const deepLink = nativeDeepLinkForRole(role);
  const started = Date.now();
  window.location.href = deepLink;
  window.setTimeout(() => {
    if (Date.now() - started < 1800 && document.visibilityState === 'visible') {
      window.location.assign(fallback);
    }
  }, 900);
}

export function MessengerHome() {
  return (
    <main className="messenger-home">
      <header className="messenger-home-brand">
        <Logo className="messenger-home-logo" size={48} />
        <p className="messenger-home-kicker">Messenger</p>
        <h1>Open the app you already use</h1>
        <p className="messenger-home-lead">
          Messenger only links to Guard, Customer, or Staff. Install one role app. One person, one
          role — there is no switch account.
        </p>
      </header>

      <ul className="messenger-home-apps">
        {ROLE_LINKS.map((item) => (
          <li key={item.role}>
            <button type="button" className="messenger-home-app" onClick={() => openRoleApp(item.role)}>
              <img
                src={`/icons/${item.role}-192.png`}
                width={48}
                height={48}
                alt=""
                className={`messenger-home-app-icon messenger-home-app-icon--${item.role}`}
              />
              <span className="messenger-home-app-copy">
                <span className="messenger-home-app-label">{item.label}</span>
                <span className="messenger-home-app-tag">{item.tagline}</span>
              </span>
              <MessageCircle className="messenger-home-app-go" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      <p className="messenger-home-policy">
        <strong>{ONE_ROLE_POLICY_TITLE}.</strong> If you sign into a Guard account and a Customer
        account — or Customer and Staff, or Staff and Guard — both accounts lock until a manager
        reviews it. They can clear the hold or block both.
      </p>

      <a className="messenger-home-download" href={`${SITE_URL}/download`}>
        <Download className="w-4 h-4" aria-hidden />
        Download a role app
      </a>
    </main>
  );
}
