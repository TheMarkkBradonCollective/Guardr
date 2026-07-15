import { ArrowRight, Building2, Shield } from 'lucide-react';
import type { FormFactor } from '../../lib/platform/device';

interface LandingPathCardsProps {
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  layout: FormFactor;
}

export function LandingPathCards({ onNavigateToAuth, layout }: LandingPathCardsProps) {
  return (
    <div className={`landing-path-grid landing-path-grid--${layout}`}>
      <button
        type="button"
        onClick={() => onNavigateToAuth('client', 'sign-up')}
        className="landing-path-card landing-path-card-client group w-full"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="text-left">
            <p className="landing-path-card-eyebrow landing-path-card-eyebrow--accent">
              For businesses &amp; sites
            </p>
            <p className="landing-path-card-title">I need security</p>
            <p className="landing-path-card-body">
              Post coverage, review guards, monitor live shifts.
            </p>
          </div>
          <Building2 className="landing-path-card-icon landing-path-card-icon--accent shrink-0 mt-0.5 group-hover:scale-105 transition-transform" />
        </div>
        <span className="landing-path-card-action landing-path-card-action--accent">
          Get started <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </button>

      <button
        type="button"
        onClick={() => onNavigateToAuth('guard', 'sign-up')}
        className="landing-path-card landing-path-card-client group w-full"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="text-left">
            <p className="landing-path-card-eyebrow landing-path-card-eyebrow--accent">Independent contractor</p>
            <p className="landing-path-card-title">I&apos;m a guard</p>
            <p className="landing-path-card-body">
              Browse jobs on the map, set your rate, work on your terms.
            </p>
          </div>
          <Shield className="landing-path-card-icon landing-path-card-icon--accent shrink-0 mt-0.5 group-hover:scale-105 transition-transform" />
        </div>
        <span className="landing-path-card-action landing-path-card-action--accent">
          Create account <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </button>
    </div>
  );
}
