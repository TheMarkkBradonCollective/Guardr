import { beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

function installWindowMock() {
  const backMock = mock.fn();
  const goMock = mock.fn();
  const history = {
    length: 2,
    state: null as Record<string, unknown> | null,
    pushState(state: Record<string, unknown>) {
      history.state = state;
      history.length += 1;
    },
    back() {
      backMock();
      history.length = Math.max(1, history.length - 1);
      history.state = null;
    },
    go(delta: number) {
      goMock(delta);
      const steps = Math.abs(delta);
      for (let i = 0; i < steps; i += 1) {
        history.length = Math.max(1, history.length - 1);
      }
      history.state = null;
    },
  };

  (globalThis as unknown as { window: { history: typeof history } }).window = { history };

  return { back: backMock, go: goMock, history };
}

describe('systemBackButton', () => {
  beforeEach(async () => {
    installWindowMock();
    const { resetSystemBackButtonStateForTests } = await import('./systemBackButton.ts');
    resetSystemBackButtonStateForTests();
  });

  it('runs the most recently registered handler first', async () => {
    const { registerSystemBackHandler, handleSystemBack } = await import('./systemBackButton.ts');
    const calls: string[] = [];
    const unregisterA = registerSystemBackHandler(() => {
      calls.push('a');
      return false;
    });
    const unregisterB = registerSystemBackHandler(() => {
      calls.push('b');
      return true;
    });

    assert.equal(handleSystemBack(), true);
    assert.deepEqual(calls, ['b']);
    unregisterA();
    unregisterB();
  });

  it('closes overlay history entries on popstate', async () => {
    const { consumeOverlayPopState, pushOverlayBackHistory } = await import('./systemBackButton.ts');
    let closed = false;
    const cleanup = pushOverlayBackHistory(() => {
      closed = true;
    });

    assert.equal(consumeOverlayPopState(), true);
    assert.equal(closed, true);
    cleanup();
  });

  it('does not close a chained overlay when the previous modal cleans up', async () => {
    const { consumeOverlayPopState, pushOverlayBackHistory } = await import('./systemBackButton.ts');

    let secondClosed = 0;
    const cleanupFirst = pushOverlayBackHistory(() => {});
    const cleanupSecond = pushOverlayBackHistory(() => {
      secondClosed += 1;
    });

    // UI dismisses the first modal while the second is already open (chaining).
    cleanupFirst();
    assert.equal(secondClosed, 0);

    // Top modal still owns the stack — user back should close only the second.
    assert.equal(consumeOverlayPopState(), true);
    assert.equal(secondClosed, 1);

    cleanupSecond();
  });

  it('calls history.back when no handler consumes the event', async () => {
    const { handleSystemBack } = await import('./systemBackButton.ts');
    const { back } = installWindowMock();

    assert.equal(handleSystemBack(), true);
    assert.equal(back.mock.calls.length, 1);
  });
});
