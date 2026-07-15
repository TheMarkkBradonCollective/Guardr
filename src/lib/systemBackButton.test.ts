import { beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

function installWindowMock() {
  const back = mock.fn();
  const history = {
    length: 2,
    state: null as Record<string, unknown> | null,
    pushState(state: Record<string, unknown>) {
      history.state = state;
      history.length += 1;
    },
    back,
  };

  (globalThis as typeof globalThis & { window: Window }).window = {
    history,
  } as unknown as Window;

  return { back, history };
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

  it('calls history.back when no handler consumes the event', async () => {
    const { handleSystemBack } = await import('./systemBackButton.ts');
    const { back } = installWindowMock();

    assert.equal(handleSystemBack(), true);
    assert.equal(back.mock.calls.length, 1);
  });
});
