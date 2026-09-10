import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  STAKEHOLDER_DOCUMENTS,
  STAKEHOLDER_DOWNLOAD_PAGE_PATH,
  resolveStakeholderDownloadPageUrl,
  resolveStakeholderPdfUrl,
} from './stakeholderDocuments';

describe('stakeholderDocuments', () => {
  it('lists executive summary, company package, and counsel intake', () => {
    const ids = STAKEHOLDER_DOCUMENTS.map((d) => d.id);
    assert.deepEqual(ids, ['executive-summary', 'company-package', 'counsel-intake']);
  });

  it('resolves stakeholder PDF paths', () => {
    assert.equal(
      resolveStakeholderPdfUrl('/stakeholder/Guardr-Executive-Summary.pdf'),
      '/stakeholder/Guardr-Executive-Summary.pdf',
    );
  });

  it('exposes public download page path', () => {
    assert.equal(STAKEHOLDER_DOWNLOAD_PAGE_PATH, '/stakeholder/');
    assert.equal(resolveStakeholderDownloadPageUrl(), '/stakeholder/');
  });
});
