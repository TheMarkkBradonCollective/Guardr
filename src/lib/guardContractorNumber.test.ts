import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GUARD_ICN_PREFIX,
  generateGuardIndependentContractorNumber,
  normalizeGuardIndependentContractorNumber,
} from './guardContractorNumber';

test('generateGuardIndependentContractorNumber uses ICN prefix', () => {
  const value = generateGuardIndependentContractorNumber();
  assert.match(value, new RegExp(`^${GUARD_ICN_PREFIX}-\\d{5}$`));
});

test('normalizeGuardIndependentContractorNumber maps legacy GR to ICN', () => {
  assert.equal(normalizeGuardIndependentContractorNumber('GR-12161'), 'ICN-12161');
  assert.equal(normalizeGuardIndependentContractorNumber('gr-12161'), 'ICN-12161');
  assert.equal(normalizeGuardIndependentContractorNumber('ICN-12161'), 'ICN-12161');
  assert.equal(normalizeGuardIndependentContractorNumber('icn-99999'), 'ICN-99999');
});

test('normalizeGuardIndependentContractorNumber leaves staff IDs alone', () => {
  assert.equal(normalizeGuardIndependentContractorNumber('OWN-00001'), 'OWN-00001');
  assert.equal(normalizeGuardIndependentContractorNumber('ADM-00003'), 'ADM-00003');
  assert.equal(normalizeGuardIndependentContractorNumber(''), '');
});
