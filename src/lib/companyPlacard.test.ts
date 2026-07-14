import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCompanyPlacardChecklist,
  companyDocumentHasContent,
  companyPlacardChecklistSummary,
  companyPlacardExpiryAlertTier,
  getCompanyPlacardPublicItems,
  shouldShowCompanyPlacard,
  type CompanyPublicDocument,
} from './companyPlacard';

const baseDoc = (patch: Partial<CompanyPublicDocument>): CompanyPublicDocument => ({
  id: 'cpd_1',
  documentType: 'business_entity_registration',
  title: 'Business Entity',
  displayOnHomepage: true,
  ...patch,
});

test('companyDocumentHasContent detects uploaded fields', () => {
  assert.equal(companyDocumentHasContent(undefined), false);
  assert.equal(companyDocumentHasContent(baseDoc({})), false);
  assert.equal(companyDocumentHasContent(baseDoc({ documentNumber: 'LLC-123' })), true);
});

test('buildCompanyPlacardChecklist tracks required missing items', () => {
  const checklist = buildCompanyPlacardChecklist([]);
  const summary = companyPlacardChecklistSummary(checklist);
  assert.equal(summary.requiredTotal, 2);
  assert.equal(summary.requiredOnFile, 0);
  assert.equal(summary.requiredMissing, 2);
});

test('getCompanyPlacardPublicItems respects public enabled flag', () => {
  const docs = [
    baseDoc({ documentNumber: 'LLC-999', documentType: 'business_entity_registration' }),
    baseDoc({
      id: 'cpd_2',
      documentType: 'general_liability_insurance',
      title: 'GL',
      documentNumber: 'GL-1',
    }),
  ];
  assert.equal(shouldShowCompanyPlacard(docs, true), true);
  assert.equal(getCompanyPlacardPublicItems(docs, true).length, 2);
  assert.equal(shouldShowCompanyPlacard(docs, false), false);
});

test('companyPlacardExpiryAlertTier flags missing required docs', () => {
  assert.equal(companyPlacardExpiryAlertTier(undefined, false, true), 'missing');
  assert.equal(companyPlacardExpiryAlertTier('2026-08-25', true, true, new Date('2026-07-14')), '45');
  assert.equal(companyPlacardExpiryAlertTier('2020-01-01', true, true, new Date('2026-07-14')), 'expired');
});

test('getCompanyPlacardPublicItems hides expired documents', () => {
  const docs = [
    baseDoc({
      documentNumber: 'GL-OLD',
      expiryDate: '2020-01-01',
      documentType: 'general_liability_insurance',
    }),
  ];
  assert.equal(getCompanyPlacardPublicItems(docs, true, new Date('2026-01-01')).length, 0);
});
