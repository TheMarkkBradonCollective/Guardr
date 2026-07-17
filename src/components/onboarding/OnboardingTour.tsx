import React, { useEffect, useMemo, useState } from 'react';
import { Block } from 'baseui/block';
import { HeadingMedium, LabelSmall, ParagraphSmall } from 'baseui/typography';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import type { OnboardingTour } from '../../lib/onboardingTours';
import { shouldOfferTutorialPrompt, type TutorialPhase, type TutorialPersistedState } from '../../lib/tutorialSession';
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
  onAddPracticeData: () => void;
  navigation: TutorialNavigationHandlers;
}

function TutorialEndBar({
  phase,
  onEnd,
  onAddPracticeData,
}: {
  phase: TutorialPhase;
  onEnd: () => void;
  onAddPracticeData: () => void;
}) {
  return (
    <div className="tutorial-end-bar" role="toolbar" aria-label="Tutorial controls">
      {phase === 'practice' && (
        <button type="button" onClick={onAddPracticeData} className="tutorial-end-bar-secondary">
          Add practice data
        </button>
      )}
      <button type="button" onClick={onEnd} className="tutorial-end-bar-primary">
        End tutorial
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
      <Block padding="scale800" className="w-full max-w-lg">
        <Block display="flex" alignItems="center" gridGap="scale300" marginBottom="scale400">
          <AccentIcon icon={Sparkles} size={20} />
          <LabelSmall margin={0} $style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            Interactive tutorial
          </LabelSmall>
        </Block>
        <HeadingMedium id="tutorial-prompt-title" marginTop={0} marginBottom="scale400">
          Take a quick tour?
        </HeadingMedium>
        <ParagraphSmall color="contentSecondary" marginBottom="scale500">
          Walk through {tour.role === 'staff' ? 'staff ops' : `the ${tour.role} app`} step by step with
          private practice data that never goes live. You can skip now and restart anytime from Settings.
        </ParagraphSmall>
        <ul className="text-sm uber-text-muted space-y-1.5 list-disc list-inside mb-6">
          <li>Practice jobs and requests stay on your device only</li>
          <li>Deleted automatically when you end the tutorial</li>
          <li>After the walkthrough, explore freely in practice mode</li>
        </ul>
        <Block display="flex" flexDirection={['column', 'column', 'row']} gridGap="scale300">
          <AppButton type="button" variant="primary" fullWidth onClick={onStart}>
            Start tutorial
          </AppButton>
          <AppButton type="button" variant="outline" fullWidth onClick={onDecline}>
            Skip for now
          </AppButton>
        </Block>
      </Block>
    </AppModal>
  );
}

function TutorialStepPanel({
  tour,
  stepIndex,
  phase,
  onNext,
  onBack,
}: {
  tour: OnboardingTour;
  stepIndex: number;
  phase: TutorialPhase;
  onNext: () => void;
  onBack: () => void;
}) {
  const step = tour.steps[stepIndex];
  const isLastStep = stepIndex >= tour.steps.length - 1;
  const inPractice = phase === 'practice';

  return (
    <div className="tutorial-step-panel" role="dialog" aria-live="polite">
      <div className="tutorial-step-panel-inner">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-1">
          {inPractice ? 'Practice mode' : `Step ${stepIndex + 1} of ${tour.steps.length}`}
        </p>
        <h2 className="text-lg font-bold text-brand-text mb-1">{step.title}</h2>
        <p className="text-sm font-medium text-brand-text mb-2">{step.body}</p>
        <p className="text-sm text-brand-text-muted leading-relaxed mb-4">{step.detail}</p>
        <div className="flex gap-2">
          {!inPractice && stepIndex > 0 && (
            <button type="button" onClick={onBack} className="app-button-outline app-btn-sm flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button type="button" onClick={onNext} className="app-button-primary app-btn-sm flex-1 flex items-center justify-center gap-1">
            {inPractice ? 'Got it' : isLastStep ? 'Enter practice mode' : 'Next'}
            {!inPractice && !isLastStep && <ChevronRight className="w-4 h-4" />}
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
  onAddPracticeData,
  navigation,
}: TutorialExperienceProps) {
  const [practiceDismissed, setPracticeDismissed] = useState(false);
  const showPrompt = shouldOfferTutorialPrompt(state, tour);
  const session = state.session;
  const phase = session?.phase;
  const stepIndex = session?.stepIndex ?? 0;
  const step = session ? tour.steps[stepIndex] : null;

  useEffect(() => {
    setPracticeDismissed(false);
  }, [session?.phase, stepIndex]);

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
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 280);
    return () => {
      window.clearTimeout(timer);
      if (step.targetSelector) {
        document.querySelector(step.targetSelector)?.classList.remove('tutorial-highlight');
      }
    };
  }, [step?.targetSelector, stepIndex]);

  const endBar = useMemo(() => {
    if (!session || !phase) return null;
    return <TutorialEndBar phase={phase} onEnd={onEnd} onAddPracticeData={onAddPracticeData} />;
  }, [session, phase, onEnd, onAddPracticeData]);

  return (
    <>
      {endBar}
      {showPrompt && <TutorialPrompt tour={tour} onStart={onStart} onDecline={onDecline} />}
      {session && phase && step && !(phase === 'practice' && practiceDismissed) && (
        <>
          <div className="tutorial-scrim" aria-hidden="true" />
          <TutorialStepPanel
            tour={tour}
            stepIndex={stepIndex}
            phase={phase}
            onNext={() => {
              if (phase === 'practice') setPracticeDismissed(true);
              else onNext();
            }}
            onBack={onBack}
          />
        </>
      )}
    </>
  );
}

/** @deprecated Use TutorialExperience */
export function OnboardingTourOverlay() {
  return null;
}
