import type { TutorialDemoSnapshot } from './tutorialDemoData';
import { createInitialTutorialDemoData } from './tutorialDemoData';
import { getTourForRole, type OnboardingTour } from './onboardingTours';

export type TutorialLifecycle = 'never' | 'declined' | 'completed';
export type TutorialPhase = 'prompt' | 'active' | 'practice';

export interface TutorialSession {
  tourId: string;
  phase: TutorialPhase;
  stepIndex: number;
  demoData: TutorialDemoSnapshot;
}

export interface TutorialPersistedState {
  lifecycle: TutorialLifecycle;
  session: TutorialSession | null;
}

const STORAGE_KEY = (userId: string) => `guardr_tutorial_${userId}`;

function emptyState(): TutorialPersistedState {
  return { lifecycle: 'never', session: null };
}

export function loadTutorialState(userId: string): TutorialPersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId));
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as TutorialPersistedState;
    if (!parsed || typeof parsed !== 'object') return emptyState();
    return {
      lifecycle: parsed.lifecycle ?? 'never',
      session: parsed.session ?? null,
    };
  } catch {
    return emptyState();
  }
}

export function saveTutorialState(userId: string, state: TutorialPersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function shouldOfferTutorialPrompt(
  state: TutorialPersistedState,
  tour: OnboardingTour | null
): boolean {
  if (!tour) return false;
  if (state.lifecycle === 'completed' || state.lifecycle === 'declined') return false;
  if (state.session) return false;
  return true;
}

export function isTutorialActive(state: TutorialPersistedState | null): boolean {
  return Boolean(state?.session && (state.session.phase === 'active' || state.session.phase === 'practice'));
}

export function startTutorialSession(userId: string, role: string): TutorialPersistedState {
  const tour = getTourForRole(role);
  if (!tour) return loadTutorialState(userId);

  const demoData = createInitialTutorialDemoData(tour.role, userId);
  const session: TutorialSession = {
    tourId: tour.id,
    phase: 'active',
    stepIndex: 0,
    demoData,
  };
  const next: TutorialPersistedState = { lifecycle: 'never', session };
  saveTutorialState(userId, next);
  return next;
}

export function declineTutorial(userId: string): TutorialPersistedState {
  const next: TutorialPersistedState = { lifecycle: 'declined', session: null };
  saveTutorialState(userId, next);
  return next;
}

export function endTutorial(userId: string): TutorialPersistedState {
  const next: TutorialPersistedState = { lifecycle: 'completed', session: null };
  saveTutorialState(userId, next);
  return next;
}

export function restartTutorial(userId: string, role: string): TutorialPersistedState {
  const next: TutorialPersistedState = { lifecycle: 'never', session: null };
  saveTutorialState(userId, next);
  return startTutorialSession(userId, role);
}

export function enterPracticeFromSettings(userId: string, role: string): TutorialPersistedState {
  const tour = getTourForRole(role);
  if (!tour) return loadTutorialState(userId);

  const existing = loadTutorialState(userId);
  const demoData =
    existing.session?.demoData ?? createInitialTutorialDemoData(tour.role, userId);
  const session: TutorialSession = {
    tourId: tour.id,
    phase: 'practice',
    stepIndex: tour.steps.length - 1,
    demoData,
  };
  const next: TutorialPersistedState = { lifecycle: existing.lifecycle, session };
  saveTutorialState(userId, next);
  return next;
}

export function advanceTutorialStep(userId: string, state: TutorialPersistedState): TutorialPersistedState {
  const tour = getTourForRoleFromId(state.session?.tourId);
  if (!state.session || !tour) return state;

  const isLast = state.session.stepIndex >= tour.steps.length - 1;
  const session: TutorialSession = isLast
    ? { ...state.session, phase: 'practice' }
    : { ...state.session, stepIndex: state.session.stepIndex + 1 };

  const next = { ...state, session };
  saveTutorialState(userId, next);
  return next;
}

export function retreatTutorialStep(userId: string, state: TutorialPersistedState): TutorialPersistedState {
  if (!state.session || state.session.stepIndex <= 0) return state;
  const session = {
    ...state.session,
    phase: 'active' as const,
    stepIndex: state.session.stepIndex - 1,
  };
  const next = { ...state, session };
  saveTutorialState(userId, next);
  return next;
}

export function updateTutorialDemoData(
  userId: string,
  state: TutorialPersistedState,
  demoData: TutorialDemoSnapshot
): TutorialPersistedState {
  if (!state.session) return state;
  const next = { ...state, session: { ...state.session, demoData } };
  saveTutorialState(userId, next);
  return next;
}

function getTourForRoleFromId(tourId?: string) {
  if (!tourId) return null;
  const roles = ['guard', 'client', 'owner', 'director', 'administrator', 'moderator', 'support'];
  for (const role of roles) {
    const tour = getTourForRole(role);
    if (tour?.id === tourId) return tour;
  }
  return null;
}
