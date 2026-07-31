import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { activateWaitingServiceWorker } from './pwaAutoUpdate';

describe('pwaAutoUpdate', () => {
  it('activateWaitingServiceWorker posts SKIP_WAITING to waiting worker', () => {
    const messages: unknown[] = [];
    const registration = {
      waiting: {
        postMessage: (msg: unknown) => messages.push(msg),
      },
    } as unknown as ServiceWorkerRegistration;

    activateWaitingServiceWorker(registration);
    assert.deepEqual(messages, [{ type: 'SKIP_WAITING' }]);
  });

  it('activateWaitingServiceWorker is a no-op without waiting worker', () => {
    assert.doesNotThrow(() =>
      activateWaitingServiceWorker({ waiting: null } as unknown as ServiceWorkerRegistration)
    );
  });
});
