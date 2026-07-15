import React from 'react';
import { PlusSquare, Share, X } from 'lucide-react';
import { motion } from 'motion/react';

interface PwaInstallGuideProps {
  isIOS: boolean;
  onClose: () => void;
  onDone?: () => void;
  className?: string;
}

function GuideStep({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-6 h-6 bg-brand-bg-sec border border-brand-border text-brand-primary flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5 rounded-full">
        {n}
      </span>
      <div className="text-brand-text-muted">{children}</div>
    </div>
  );
}

export function PwaInstallGuide({ isIOS, onClose, onDone, className = '' }: PwaInstallGuideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className={`landing-pwa-guide app-card-elevated ${className}`.trim()}
      role="dialog"
      aria-labelledby="pwa-install-guide-title"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close install guide"
        className="absolute top-4 right-4 text-brand-text-muted hover:text-brand-text transition-colors"
      >
        <X size={16} />
      </button>

      <div className="space-y-4">
        <div className="border-b border-brand-border pb-3 pr-8">
          <h3 id="pwa-install-guide-title" className="text-sm font-semibold text-brand-text">
            Install on your device
          </h3>
          <p className="text-xs text-brand-text-muted mt-1">
            Save Guardr to your home screen for quick access and auto-updates.
          </p>
        </div>

        {isIOS ? (
          <div className="space-y-3 text-sm">
            <GuideStep n={1}>
              Open <strong>Safari</strong> and visit guardr.co.
            </GuideStep>
            <GuideStep n={2}>
              <span className="flex items-center gap-1.5 flex-wrap">
                Tap the{' '}
                <strong className="inline-flex items-center gap-0.5 border border-brand-border px-1.5 py-0.5 rounded-lg">
                  <Share size={12} className="text-blue-400" /> Share
                </strong>{' '}
                button at the bottom of Safari.
              </span>
            </GuideStep>
            <GuideStep n={3}>
              <span className="flex items-center gap-1.5 flex-wrap">
                Scroll down and select{' '}
                <strong className="inline-flex items-center gap-0.5 border border-brand-border px-1.5 py-0.5 rounded-lg">
                  <PlusSquare size={12} /> Add to Home Screen
                </strong>
                .
              </span>
            </GuideStep>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <GuideStep n={1}>
              Open the browser menu (tap the <strong>three dots</strong> at the top right).
            </GuideStep>
            <GuideStep n={2}>
              Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
            </GuideStep>
          </div>
        )}

        <div className="pt-2 flex gap-2">
          <button
            type="button"
            onClick={() => {
              onDone?.();
              onClose();
            }}
            className="app-button-primary app-btn-md flex-1"
          >
            Done
          </button>
          <button type="button" onClick={onClose} className="app-button-outline app-btn-md">
            Back
          </button>
        </div>
      </div>
    </motion.div>
  );
}
