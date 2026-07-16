import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  groupGuardsIntoNotificationWaves,
  isPremiumJob,
  notificationWaveDelayMs,
  tierJobNotificationCopy,
  tierMatchingBoostPoints,
} from './guardTierJobPriority';

describe('isPremiumJob', () => {
  it('flags high guard pay as premium', () => {
    assert.equal(isPremiumJob({ hourlyRate: 50, guardPay: 40 }), true);
  });

  it('flags multi-guard jobs as premium', () => {
    assert.equal(isPremiumJob({ hourlyRate: 25, guardPay: 20, guardsNeeded: 3 }), true);
  });

  it('does not flag standard single-guard jobs below the pay threshold', () => {
    assert.equal(isPremiumJob({ hourlyRate: 30, guardPay: 25, guardsNeeded: 1 }), false);
  });
});

describe('tierMatchingBoostPoints', () => {
  it('adds base and premium boosts for elite guards on premium jobs', () => {
    assert.equal(tierMatchingBoostPoints('elite', true), 18);
  });

  it('uses only the base boost on standard jobs', () => {
    assert.equal(tierMatchingBoostPoints('professional', false), 5);
  });
});

describe('notificationWaveDelayMs', () => {
  it('staggers lower tiers on standard jobs', () => {
    assert.equal(notificationWaveDelayMs('elite', false), 0);
    assert.equal(notificationWaveDelayMs('starting', false), 15 * 60 * 1000);
  });

  it('compresses waves for premium jobs', () => {
    assert.equal(notificationWaveDelayMs('professional', true), 0);
    assert.equal(notificationWaveDelayMs('rising', true), 5 * 60 * 1000);
  });
});

describe('groupGuardsIntoNotificationWaves', () => {
  it('orders waves elite through starting with per-tier delays', () => {
    const waves = groupGuardsIntoNotificationWaves(
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      (guard) => (guard.id === 'a' ? 'elite' : guard.id === 'b' ? 'rising' : 'starting'),
      false
    );

    assert.deepEqual(
      waves.map((wave) => wave.tierId),
      ['elite', 'rising', 'starting']
    );
    assert.equal(waves[0]?.delayMs, 0);
    assert.equal(waves[1]?.delayMs, 10 * 60 * 1000);
  });
});

describe('tierJobNotificationCopy', () => {
  it('uses priority copy for elite guards on premium jobs', () => {
    const copy = tierJobNotificationCopy('elite', true, 'VIP Gala');
    assert.equal(copy.title, 'Priority job — high paying shift');
    assert.equal(copy.priority, 'high');
  });
});
