import React from 'react';
import {
  ArrowRight,
  Bell,
  CreditCard,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import type { SessionUser } from '../../types';
import { PRODUCT_APP_TAGLINES, productAppForRole, productAppSpokenName, type ProductRole } from '../../lib/productApps';
import { AppButton } from '../ui/AppButton';

interface WebsiteAccountHomeProps {
  currentUser: SessionUser;
  role: ProductRole;
  statusLabel?: string;
  statusDetail?: string;
  billingSummary?: string;
  notificationCount?: number;
  onboardingOpen?: boolean;
  onOpenApp: () => void;
  onOpenBilling: () => void;
  onOpenProfile: () => void;
}

export function WebsiteAccountHome({
  currentUser,
  role,
  statusLabel = 'Active',
  statusDetail,
  billingSummary,
  notificationCount = 0,
  onboardingOpen = false,
  onOpenApp,
  onOpenBilling,
  onOpenProfile,
}: WebsiteAccountHomeProps) {
  const app = productAppForRole(role);
  const appName = productAppSpokenName(role);
  const hireWorkLead = onboardingOpen
    ? `Finish signup and activation here so you can see the current Guardr requirements. After activation you need the ${appName} to use the platform. This website stays for profile, billing, messages, and support.`
    : `Manage profile, billing, messages, and support here. After activation you need the ${appName} to use the platform.`;

  return (
    <div className="website-account-home">
      <header className="website-account-hero">
        <p className="website-account-kicker">Website account</p>
        <h1>Welcome back, {currentUser.name.split(' ')[0] || currentUser.name}</h1>
        <p className="website-account-lead">
          {role === 'staff'
            ? 'Profile, billing, and support live here. Dispatch, people, and the rest of operations run in this browser — the Staff app is optional.'
            : hireWorkLead}
        </p>
        <div className="website-account-hero-actions">
          <AppButton variant="primary" size="lg" onClick={onOpenApp}>
            {role === 'staff' ? 'Open Staff' : onboardingOpen ? 'Continue application' : `Get the ${appName}`}
            <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
          </AppButton>
          <AppButton variant="outline" size="lg" onClick={onOpenProfile}>
            Edit profile
          </AppButton>
        </div>
      </header>

      <section className="website-account-metrics" aria-label="Account snapshot">
        <article>
          <span className="website-account-metric-label">Account</span>
          <strong>{statusLabel}</strong>
          <p>{statusDetail || currentUser.email}</p>
        </article>
        <article>
          <span className="website-account-metric-label">
            {role === 'guard' ? 'Payouts' : 'Billing'}
          </span>
          <strong>{billingSummary || 'On file'}</strong>
          <p>{role === 'guard' ? 'Payout details stay on this account' : 'Invoices and payment methods'}</p>
        </article>
        <article>
          <span className="website-account-metric-label">Alerts</span>
          <strong>{notificationCount}</strong>
          <p>{notificationCount === 1 ? 'Unread notification' : 'Unread notifications'}</p>
        </article>
      </section>

      <section className="website-account-cards">
        <button type="button" className="website-account-card" onClick={onOpenApp}>
          <Smartphone size={22} strokeWidth={2} aria-hidden />
          <h2>{role === 'staff' ? 'Staff' : onboardingOpen ? 'Application' : appName}</h2>
          <p>
            {role === 'staff'
              ? 'Operations run in this browser. The Staff app is optional.'
              : onboardingOpen
                ? `Complete activation on the website. Then you need the ${appName} to use the platform.`
                : PRODUCT_APP_TAGLINES[app]}
          </p>
          <span>
            {role === 'staff' ? 'Continue' : onboardingOpen ? 'Continue' : `Get the ${appName}`} <ArrowRight size={14} aria-hidden />
          </span>
        </button>
        <button type="button" className="website-account-card" onClick={onOpenBilling}>
          {role === 'guard' ? <ShieldCheck size={22} strokeWidth={2} aria-hidden /> : <CreditCard size={22} strokeWidth={2} aria-hidden />}
          <h2>{role === 'guard' ? 'Payouts' : 'Billing'}</h2>
          <p>
            {role === 'guard'
              ? 'Bank / Stripe payout details and receipts.'
              : 'Payment methods, invoices, and receipts.'}
          </p>
          <span>
            Manage <ArrowRight size={14} aria-hidden />
          </span>
        </button>
        <button type="button" className="website-account-card" onClick={onOpenProfile}>
          <Bell size={22} strokeWidth={2} aria-hidden />
          <h2>Profile &amp; notifications</h2>
          <p>Name, photo, and how we reach you{role === 'staff' ? '.' : `. Operational alerts live in the ${appName}.`}</p>
          <span>
            Update <ArrowRight size={14} aria-hidden />
          </span>
        </button>
      </section>
    </div>
  );
}
