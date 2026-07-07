import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import type { OnboardingTour } from '../../lib/onboardingTours';
import { markTourCompleted } from '../../lib/onboardingTours';

interface OnboardingTourOverlayProps {
  tour: OnboardingTour;
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTourOverlay({ tour, userId, onComplete, onSkip }: OnboardingTourOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = tour.steps[stepIndex];
  const isLast = stepIndex === tour.steps.length - 1;

  useEffect(() => {
    if (!step?.targetSelector) return;
    const el = document.querySelector(step.targetSelector);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [step]);

  const finish = () => {
    markTourCompleted(userId, tour.id);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-brand-surface border border-brand-border shadow-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">
            Step {stepIndex + 1} of {tour.steps.length}
          </p>
          <button type="button" onClick={onSkip} className="p-1 text-brand-text-muted hover:text-brand-text" aria-label="Skip tour">
            <X className="w-5 h-5" />
          </button>
        </div>
        <h2 className="text-xl font-bold text-brand-text mb-2">{step.title}</h2>
        <p className="text-sm text-brand-text-muted mb-6">{step.body}</p>
        <div className="flex gap-2">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => setStepIndex((i) => i - 1)}
              className="uber-btn uber-btn-secondary flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button
            type="button"
            onClick={() => (isLast ? finish() : setStepIndex((i) => i + 1))}
            className="uber-btn uber-btn-primary flex-1 flex items-center justify-center gap-1"
          >
            {isLast ? 'Get started' : 'Next'}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
