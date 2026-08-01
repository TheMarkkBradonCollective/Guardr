import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceTutorialStep,
  declineTutorial,
  endTutorial,
  loadTutorialState,
  restartTutorial,
  shouldOfferTutorialPrompt,
  startTutorialSession,
} from './tutorialSession.ts';
import { GUARD_ONBOARDING_TOUR } from './onboardingTours.ts';

const USER = 'user-test-1';

function installLocalStorageMock(): void {
  const store = new Map<string, string>();
  const mock = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
  (globalThis as { localStorage?: typeof mock }).localStorage = mock;
}

describe('tutorialSession', () => {
  beforeEach(() => {
    installLocalStorageMock();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('offers prompt for first-time users', () => {
    const state = loadTutorialState(USER);
    assert.equal(shouldOfferTutorialPrompt(state, GUARD_ONBOARDING_TOUR), true);
  });

  it('does not offer prompt after decline', () => {
    const state = declineTutorial(USER);
    assert.equal(shouldOfferTutorialPrompt(state, GUARD_ONBOARDING_TOUR), false);
  });

  it('starts session with demo data and completes on last step', () => {
    let state = startTutorialSession(USER, 'guard');
    assert.equal(state.session?.phase, 'active');
    assert.equal(state.session?.stepIndex, 0);
    assert.ok(state.session?.demoData.requests.length > 0);

    for (let i = 0; i < GUARD_ONBOARDING_TOUR.steps.length - 1; i += 1) {
      state = advanceTutorialStep(USER, state);
      assert.equal(state.session?.phase, 'active');
    }

    state = advanceTutorialStep(USER, state);
    assert.equal(state.lifecycle, 'completed');
    assert.equal(state.session, null);
  });

  it('clears session on end', () => {
    startTutorialSession(USER, 'guard');
    const ended = endTutorial(USER);
    assert.equal(ended.lifecycle, 'completed');
    assert.equal(ended.session, null);
  });

  it('restart creates a fresh session', () => {
    endTutorial(USER);
    const restarted = restartTutorial(USER, 'guard');
    assert.equal(restarted.session?.phase, 'active');
    assert.equal(restarted.session?.stepIndex, 0);
  });

  it('migrates legacy practice sessions to completed', () => {
    localStorage.setItem(
      `guardr_tutorial_${USER}`,
      JSON.stringify({
        lifecycle: 'never',
        session: {
          tourId: 'guard-welcome',
          phase: 'practice',
          stepIndex: 6,
          demoData: { requests: [], createdAt: '', updatedAt: '' },
        },
      }),
    );
    const state = loadTutorialState(USER);
    assert.equal(state.lifecycle, 'completed');
    assert.equal(state.session, null);
  });
});
