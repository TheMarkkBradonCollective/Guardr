import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  LEGAL_ENTITY_NAME,
  SIGNATURE_SECURITY_SPECIALIST_NAME,
} from './siteConfig';

// Mirror ENTITY_PATTERN from SignatureSecurityBrand.tsx for unit coverage without DOM.
const ENTITY_PATTERN = new RegExp(
  `${LEGAL_ENTITY_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${SIGNATURE_SECURITY_SPECIALIST_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
  'g',
);

function countEntityMentions(text: string): number {
  return [...text.matchAll(ENTITY_PATTERN)].length;
}

describe('signature security brand mentions', () => {
  it('matches legal entity and short parent brand name', () => {
    assert.equal(countEntityMentions(`Operated by ${LEGAL_ENTITY_NAME}.`), 1);
    assert.equal(
      countEntityMentions(`Guardr by ${SIGNATURE_SECURITY_SPECIALIST_NAME}`),
      1,
    );
    assert.equal(
      countEntityMentions(`${LEGAL_ENTITY_NAME} and ${SIGNATURE_SECURITY_SPECIALIST_NAME}`),
      2,
    );
  });
});
