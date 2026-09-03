import React, { useEffect, useMemo } from 'react';
import { Block } from 'baseui/block';
import { HeadingMedium, LabelSmall, ParagraphSmall } from 'baseui/typography';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import type { OnboardingTour } from '../../lib/onboardingTours';
import { shouldOfferTutorialPrompt, type TutorialPersistedState } from '../../lib/tutorialSession';
import { AppModal } from '../ui/motion/AppMotion';
import { AppButton } from '../ui/AppButton';
import { AccentIcon } from '../baseui/dashboard';
import { useSurfaceKind } from '../../surfaces';

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
  const surface = useSurfaceKind();
  const sheet = surface === 'mobile';

  return (
    <AppModal
      open
      onClose={onDecline}
      align={sheet ? 'bottom' : 'center'}
      zIndex={9998}
      ariaLabelledBy="tutorial-prompt-title"
      panelClassName={sheet ? 'sfm-tutorial-prompt' : undefined}
    >
      <Block padding={sheet ? 'scale600' : 'scale800'} className={sheet ? 'sfm-tutorial-prompt-inner' : 'w-full max-w-lg'}>
        {sheet ? <div className="sfm-confirm-grabber" aria-hidden /> : null}
        <Block display="flex" alignItems="center" gridGap="scale300" marginBottom="scale400">
          <AccentIcon icon={Sparkles} size={20} />
          <LabelSmall margin={0} $style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            Interactive tutorial
          </LabelSmall>
        </Block>
        <HeadingMedium id="tutorial-prompt-title" marginTop={0} marginBottom="scale400">
          Take a guided tour?
        </HeadingMedium>
        <ParagraphSmall color="contentSecondary" marginBottom="scale500">
          Walk through each page of the {tour.role === 'staff' ? 'staff console' : `${tour.role} app`} with
          step-by-step explanations. Sample data stays on your device only and is removed when you finish.
        </ParagraphSmall>
        <ul className="text-sm uber-text-muted space-y-1.5 list-disc list-inside mb-6">
          <li>Each step focuses on one part of the current page</li>
          <li>Sample jobs and requests are not sent live</li>
          <li>Restart anytime from Guide → Interactive tutorial</li>
        </ul>
        <Block display="flex" flexDirection={sheet ? 'column' : ['column', 'column', 'row']} gridGap="scale300">
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
    <div className="tutorial-step-panel" role="dialog" aria-live="polite">
      <div className="tutorial-step-panel-inner">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-1">
          Step {stepIndex + 1} of {tour.steps.length}
        </p>
        <h2 className="text-lg font-bold text-brand-text mb-1">{step.title}</h2>
        <div className="tutorial-step-panel-body">
          <p className="text-sm font-medium text-brand-text mb-2">{step.body}</p>
          <p className="text-sm text-brand-text-muted leading-relaxed mb-2">{step.detail}</p>
          {step.tips && step.tips.length > 0 ? (
            <ul className="tutorial-step-panel-tips">
              {step.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="flex gap-2 tutorial-step-panel-actions">
          {stepIndex > 0 && (
            <button type="button" onClick={onBack} className="app-button-outline app-btn-sm flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button type="button" onClick={onNext} className="app-button-primary app-btn-sm flex-1 flex items-center justify-center gap-1 min-h-11">
            {isLastStep ? 'Finish tutorial' : 'Next'}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
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
