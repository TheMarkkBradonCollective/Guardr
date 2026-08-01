import React, { useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import type { OnboardingTour } from '../../lib/onboardingTours';
import { shouldOfferTutorialPrompt, type TutorialPersistedState } from '../../lib/tutorialSession';
import { AppModal } from '../ui/motion/AppMotion';
import { AppButton } from '../ui/AppButton';
import { AccentIcon } from '../baseui/dashboard';

export interface TutorialNavigationHandlers {
  onGuardTab?: (tab: string) => void;
  onClientView?: (view: string) => void;
  onStaffSection?: (section: string) => void;
}

interface TutorialExperienceProps {
  tour: OnboardingTour;
  state: TutorialPersistedState;
  onStart: () => void;
  onDecline: () => void;
  onEnd: () => void;
  onNext: () => void;
  onBack: () => void;
  navigation: TutorialNavigationHandlers;
}

function TutorialEndBar({ onEnd }: { onEnd: () => void }) {
  return (
    <div className="tutorial-end-bar" role="toolbar" aria-label="Tutorial controls">
      <button type="button" onClick={onEnd} className="tutorial-end-bar-primary">
        End
      </button>
    </div>
  );
}

function TutorialPrompt({
  tour,
  onStart,
  onDecline,
}: {
  tour: OnboardingTour;
  onStart: () => void;
  onDecline: () => void;
}) {
  return (
    <AppModal open onClose={onDecline} align="center" zIndex={9998} ariaLabelledBy="tutorial-prompt-title">
      <div className="tutorial-prompt-card w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-3">
          <AccentIcon icon={Sparkles} size={18} />
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-primary m-0">Tutorial</p>
        </div>
        <h2 id="tutorial-prompt-title" className="text-lg font-bold text-brand-text m-0 mb-2">
          Quick page-by-page tour?
        </h2>
        <p className="text-sm text-brand-text-muted m-0 mb-5 leading-relaxed">
          Short tips on each {tour.role === 'staff' ? 'staff' : tour.role} screen. Sample data stays on this device only.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <AppButton type="button" variant="primary" fullWidth onClick={onStart}>
            Start
          </AppButton>
          <AppButton type="button" variant="outline" fullWidth onClick={onDecline}>
            Skip
          </AppButton>
        </div>
      </div>
    </AppModal>
  );
}

function TutorialStepPanel({
  tour,
  stepIndex,
  onNext,
  onBack,
}: {
  tour: OnboardingTour;
  stepIndex: number;
  onNext: () => void;
  onBack: () => void;
}) {
  const step = tour.steps[stepIndex];
  const isLastStep = stepIndex >= tour.steps.length - 1;

  return (
    <div className="tutorial-step-panel" role="dialog" aria-live="polite" aria-label={step.title}>
      <div className="tutorial-step-panel-inner">
        <div className="tutorial-step-panel-copy">
          <p className="tutorial-step-panel-kicker">
            {stepIndex + 1}/{tour.steps.length}
          </p>
          <p className="tutorial-step-panel-title">{step.title}</p>
          <p className="tutorial-step-panel-body">{step.body}</p>
        </div>
        <div className="tutorial-step-panel-actions">
          {stepIndex > 0 ? (
            <button type="button" onClick={onBack} className="tutorial-step-btn tutorial-step-btn--ghost" aria-label="Back">
              <ChevronLeft className="w-4 h-4" aria-hidden />
            </button>
          ) : null}
          <button type="button" onClick={onNext} className="tutorial-step-btn tutorial-step-btn--primary">
            {isLastStep ? 'Done' : 'Next'}
            {!isLastStep ? <ChevronRight className="w-4 h-4" aria-hidden /> : null}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TutorialExperience({
  tour,
  state,
  onStart,
  onDecline,
  onEnd,
  onNext,
  onBack,
  navigation,
}: TutorialExperienceProps) {
  const showPrompt = shouldOfferTutorialPrompt(state, tour);
  const session = state.session;
  const stepIndex = session?.stepIndex ?? 0;
  const step = session ? tour.steps[stepIndex] : null;

  useEffect(() => {
    if (!session || !step) return;
    if (step.navigate?.guardTab) navigation.onGuardTab?.(step.navigate.guardTab);
    if (step.navigate?.clientView) navigation.onClientView?.(step.navigate.clientView);
    if (step.navigate?.staffSection) navigation.onStaffSection?.(step.navigate.staffSection);
  }, [session, step, stepIndex, navigation]);

  useEffect(() => {
    if (!step?.targetSelector) return;
    const timer = window.setTimeout(() => {
      const el = document.querySelector(step.targetSelector!);
      el?.classList.add('tutorial-highlight');
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 280);
    return () => {
      window.clearTimeout(timer);
      if (step.targetSelector) {
        document.querySelector(step.targetSelector)?.classList.remove('tutorial-highlight');
      }
    };
  }, [step?.targetSelector, stepIndex]);

  const endBar = useMemo(() => {
    if (!session) return null;
    return <TutorialEndBar onEnd={onEnd} />;
  }, [session, onEnd]);

  return (
    <>
      {endBar}
      {showPrompt && <TutorialPrompt tour={tour} onStart={onStart} onDecline={onDecline} />}
      {session && step && (
        <>
          <div className="tutorial-scrim" aria-hidden="true" />
          <TutorialStepPanel tour={tour} stepIndex={stepIndex} onNext={onNext} onBack={onBack} />
        </>
      )}
    </>
  );
}

/** @deprecated Use TutorialExperience */
export function OnboardingTourOverlay() {
  return null;
}
