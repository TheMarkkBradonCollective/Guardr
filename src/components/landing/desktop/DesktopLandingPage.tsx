import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Shield, Building2 } from 'lucide-react';
import type { ThemeMode } from '../../../lib/platform/theme';
import type { LegalPageId } from '../../../lib/legalContent';
import { LEGAL_ENTITY_NAME } from '../../../lib/siteConfig';
import type { CompanyPublicDocument } from '../../../lib/companyPlacard';
import { Logo } from '../../Logo';
import { ThemeToggle } from '../../ui/ThemeToggle';
import { LegalFooterLinks } from '../../legal/LegalFooterLinks';
import { CompanyPublicPlacard } from '../../public/CompanyPublicPlacard';
import { DesktopLandingHeroPreview } from './DesktopLandingHeroPreview';

interface DesktopLandingPageProps {
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onOpenLegal: (page: LegalPageId) => void;
  onOpenGuide?: () => void;
  ownerMessage?: string;
  directorMessage?: string;
  companyPlacardDocuments?: CompanyPublicDocument[];
}

const CAPABILITIES = [
  'Live operations map',
  'Credential verification',
  'Shift check-ins & audits',
  'In-platform messaging',
  'Direct payments',
  'Crew coordination',
];

export function DesktopLandingPage({
  onNavigateToAuth,
  themeMode,
  onChangeTheme,
  onOpenLegal,
  onOpenGuide,
  ownerMessage,
  directorMessage,
  companyPlacardDocuments = [],
}: DesktopLandingPageProps) {
  return (
    <div className="dsk-landing" data-landing-factor="desktop">
      <div className="dsk-landing-split">
        <aside className="dsk-landing-editorial">
          <div className="dsk-landing-editorial-top">
            <div className="dsk-landing-logo-row">
              <Logo size={28} className="text-brand-primary" />
              <span className="dsk-landing-logo-text">
                Guard<span className="text-brand-primary">r</span>
              </span>
            </div>
            <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" />
          </div>

          <motion.div
            className="dsk-landing-editorial-body"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
          >
            <p className="dsk-landing-label">Security operations platform</p>
            <h1 className="dsk-landing-headline">
              Run coverage.
              <br />
              Run your business.
              <br />
              <span className="dsk-landing-headline-dim">One desktop console.</span>
            </h1>
            <p className="dsk-landing-deck">
              Clients command sites. Guards run independent careers. Staff orchestrates the field.
              Purpose-built desktop workspaces — not a stretched phone app.
            </p>

            {(ownerMessage?.trim() || directorMessage?.trim()) && (
              <div className="dsk-landing-quotes">
                {ownerMessage?.trim() ? (
                  <blockquote>
                    <p className="dsk-landing-quote-author">Markeith White · Founder</p>
                    <p>{ownerMessage}</p>
                  </blockquote>
                ) : null}
                {directorMessage?.trim() ? (
                  <blockquote>
                    <p className="dsk-landing-quote-author">Tyrone Johnson · Director</p>
                    <p>{directorMessage}</p>
                  </blockquote>
                ) : null}
              </div>
            )}

            <div className="dsk-landing-cta-row">
              <button
                type="button"
                className="dsk-landing-cta dsk-landing-cta--light"
                onClick={() => onNavigateToAuth('client', 'sign-up')}
              >
                <Building2 className="w-4 h-4" />
                Client workspace
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="dsk-landing-cta dsk-landing-cta--outline"
                onClick={() => onNavigateToAuth('guard', 'sign-up')}
              >
                <Shield className="w-4 h-4" />
                Guard workspace
              </button>
            </div>

            <button
              type="button"
              className="dsk-landing-signin"
              onClick={() => onNavigateToAuth(undefined, 'sign-in')}
            >
              Sign in to existing account →
            </button>

            <ul className="dsk-landing-capabilities">
              {CAPABILITIES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </motion.div>

          <footer className="dsk-landing-editorial-foot">
            {onOpenGuide ? (
              <button type="button" onClick={onOpenGuide} className="dsk-landing-foot-link">
                Guide
              </button>
            ) : null}
            <LegalFooterLinks onOpenLegal={onOpenLegal} />
            <p className="dsk-landing-copy">© {new Date().getFullYear()} {LEGAL_ENTITY_NAME}</p>
          </footer>
        </aside>

        <section className="dsk-landing-product" aria-label="Product preview">
          <div className="dsk-landing-product-chrome">
            <span />
            <span />
            <span />
            <p>Guardr desktop · operations console</p>
          </div>
          <DesktopLandingHeroPreview />
        </section>
      </div>

      {companyPlacardDocuments.length > 0 ? (
        <div className="dsk-landing-placard">
          <CompanyPublicPlacard documents={companyPlacardDocuments} />
        </div>
      ) : null}
    </div>
  );
}
