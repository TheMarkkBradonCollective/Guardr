import React, { useState } from 'react';
import {
  BadgeCheck,
  Briefcase,
  ChevronRight,
  Lock,
  MapPin,
  Menu,
  Shield,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { Logo } from '../../Logo';
import { LegalFooterLinks } from '../../legal/LegalFooterLinks';
import { LegalEntityName } from '../../SignatureSecurityBrand';
import { CompanyPublicPlacard } from '../../public/CompanyPublicPlacard';
import { LandingAppDownloads } from '../LandingAppDownloads';
import { EXPLORE_SERVICES } from '../mobility/mobilityLandingData';
import type { LandingSectionsProps } from '../shared/LandingSections';
import { resolveManualPdfUrl, USER_MANUALS_COMBINED_HREF } from '../../../lib/userManuals';
import { resolveAppDownloadPageUrl } from '../../../lib/siteConfig';

const TRUST_CHIPS = [
  { icon: BadgeCheck, label: 'Licensed only' },
  { icon: MapPin, label: 'Map-first jobs' },
  { icon: Zap, label: 'Direct pay' },
  { icon: Lock, label: 'Shift tracking' },
] as const;

/**
 * Phone-app landing — not a scaled tablet or desktop homepage.
 *
 * Compact translucent top bar, stacked role cards in the thumb zone, snap-scroll
 * trust chips, a vertical action list, and a sticky Get started dock. There is no
 * black marketing nav, booking form, or multi-column explore grid.
 */
export function MobileLandingPage({
  onNavigateToAuth,
  onOpenLegal,
  onOpenGuide,
  companyPlacardDocuments = [],
}: LandingSectionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const goClient = () => onNavigateToAuth('client', 'sign-up');
  const goGuard = () => onNavigateToAuth('guard', 'sign-up');
  const goSignIn = () => onNavigateToAuth(undefined, 'sign-in');
  const goSignUp = () => onNavigateToAuth(undefined, 'sign-up');

  return (
    <div className="mbl-landing" data-landing-factor="mobile">
      <header className="mbl-landing-top">
        <a href="/" className="mbl-landing-wordmark" aria-label="Guardr home">
          <Logo size={22} />
          <span>Guardr</span>
        </a>
        <div className="mbl-landing-top-actions">
          <button type="button" className="mbl-landing-login" onClick={goSignIn}>
            Log in
          </button>
          <button
            type="button"
            className="mbl-landing-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} strokeWidth={2.25} aria-hidden /> : <Menu size={20} strokeWidth={2.25} aria-hidden />}
          </button>
        </div>
      </header>

      {menuOpen ? (
        <nav className="mbl-landing-menu-sheet" aria-label="Mobile menu">
          <button
            type="button"
            className="mbl-landing-menu-item"
            onClick={() => {
              setMenuOpen(false);
              goClient();
            }}
          >
            For clients
          </button>
          <button
            type="button"
            className="mbl-landing-menu-item"
            onClick={() => {
              setMenuOpen(false);
              goGuard();
            }}
          >
            For guards
          </button>
          {onOpenGuide ? (
            <button
              type="button"
              className="mbl-landing-menu-item"
              onClick={() => {
                setMenuOpen(false);
                onOpenGuide();
              }}
            >
              Help
            </button>
          ) : null}
          <a
            className="mbl-landing-menu-item"
            href={resolveAppDownloadPageUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            Download app
          </a>
          <a
            className="mbl-landing-menu-item"
            href={resolveManualPdfUrl(USER_MANUALS_COMBINED_HREF)}
            download="Guardr-User-Manuals-Combined.pdf"
            type="application/pdf"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            Manuals
          </a>
        </nav>
      ) : null}

      <main className="mbl-landing-main">
        <section className="mbl-landing-hero" aria-label="Hero">
          <p className="mbl-landing-kicker">Security marketplace</p>
          <h1 className="mbl-landing-title">
            Coverage on the map.
            <br />
            Pay in the app.
          </h1>
          <p className="mbl-landing-lede">
            Hire licensed guards for a site, or pick up independent contractor shifts near you.
          </p>

          <div className="mbl-landing-roles">
            <button type="button" className="mbl-landing-role mbl-landing-role--primary" onClick={goClient}>
              <span className="mbl-landing-role-icon" aria-hidden>
                <Briefcase size={22} strokeWidth={2.25} />
              </span>
              <span className="mbl-landing-role-copy">
                <span className="mbl-landing-role-title">I need coverage</span>
                <span className="mbl-landing-role-sub">Post a job as a client</span>
              </span>
              <ChevronRight size={20} strokeWidth={2.25} aria-hidden />
            </button>
            <button type="button" className="mbl-landing-role" onClick={goGuard}>
              <span className="mbl-landing-role-icon" aria-hidden>
                <Shield size={22} strokeWidth={2.25} />
              </span>
              <span className="mbl-landing-role-copy">
                <span className="mbl-landing-role-title">I want to work</span>
                <span className="mbl-landing-role-sub">Find shifts as a guard</span>
              </span>
              <ChevronRight size={20} strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        </section>

        <section className="mbl-landing-trust" aria-label="Platform features">
          <div className="mbl-landing-trust-scroller">
            {TRUST_CHIPS.map(({ icon: Icon, label }) => (
              <span key={label} className="mbl-landing-chip">
                <Icon size={14} strokeWidth={2.4} aria-hidden />
                {label}
              </span>
            ))}
          </div>
        </section>

        <section className="mbl-landing-list" aria-label="What you can do">
          <h2 className="mbl-landing-section-title">On your phone</h2>
          <div className="mbl-landing-rows">
            {EXPLORE_SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.id}
                  type="button"
                  className="mbl-landing-row"
                  onClick={() => onNavigateToAuth(service.role ?? 'client', 'sign-up')}
                >
                  <span className="mbl-landing-row-icon" aria-hidden>
                    <Icon size={20} strokeWidth={2} />
                  </span>
                  <span className="mbl-landing-row-copy">
                    <span className="mbl-landing-row-title">{service.title}</span>
                    <span className="mbl-landing-row-body">{service.body}</span>
                  </span>
                  <ChevronRight size={18} strokeWidth={2.25} aria-hidden />
                </button>
              );
            })}
          </div>
        </section>

        <section className="mbl-landing-signin" aria-label="Sign in">
          <Wallet size={22} strokeWidth={2} aria-hidden />
          <div className="mbl-landing-signin-copy">
            <h2>Already on Guardr?</h2>
            <p>Shifts, coverage, earnings, and messages live in the same app.</p>
          </div>
          <button type="button" className="mbl-landing-signin-btn" onClick={goSignIn}>
            Log in
          </button>
        </section>

        <section className="mbl-landing-apps" aria-label="Download the app">
          <LandingAppDownloads formFactor="mobile" variant="cta" />
        </section>

        {companyPlacardDocuments.length > 0 ? (
          <CompanyPublicPlacard documents={companyPlacardDocuments} />
        ) : null}

        <footer className="mbl-landing-footer" role="contentinfo">
          <p>
            © {new Date().getFullYear()} <LegalEntityName />
          </p>
          <LegalFooterLinks onOpenLegal={onOpenLegal} className="mbl-landing-legal" />
        </footer>
      </main>

      <div className="mbl-landing-dock">
        <button type="button" className="mbl-landing-dock-btn" onClick={goSignUp}>
          Get started
        </button>
      </div>
    </div>
  );
}
