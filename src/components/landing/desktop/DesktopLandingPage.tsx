import React from 'react';
import type { LandingSectionsProps } from '../shared/LandingSections';
import { MobilityStyleLandingPage } from '../mobility/MobilityStyleLandingPage';

/**
 * Desktop landing — operations-centre marketing site.
 * Ink nav, four-up explore, command-palette hint. Not a scaled tablet page.
 */
export function DesktopLandingPage(props: LandingSectionsProps) {
  return (
    <div className="dsk-landing">
      <MobilityStyleLandingPage {...props} formFactor="desktop" />
      <aside className="dsk-landing-palette" aria-label="Keyboard shortcut">
        <p>
          After you sign in, press <kbd>Ctrl</kbd>
          <span aria-hidden>+</span>
          <kbd>K</kbd> to open the command palette — every destination, in one keystroke.
        </p>
      </aside>
    </div>
  );
}
