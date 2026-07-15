import { SecurityGuard } from '../types';
import { certHasDocumentProof } from './certImagePolicy';
import { resolveCertCatalogId } from './certCatalog';
import { getGuardActivationChecklist, getGuardCardCertifications } from './guardAccountActivation';
import { coiApprovalItemId, govIdApprovalItemId } from './guardCredentialSections';
import { guardHasInsuranceSubmitted } from './guardInsurance';
import {
  guardHasVerifiedIdForWork,
  guardMeets32HourBlock,
  guardMeets32HourBlockVerified,
  guardMeetsLevel1,
  guardMeetsPtaUofTraining,
  guardMeetsPtaUofTrainingVerified,
  isPtaUofCatalogId,
  isThirtyTwoHourCatalogId,
} from './guardQualification';

export type GuardApplicationCredentialStepStatus = 'pending' | 'submitted' | 'verified';

export interface GuardApplicationCredentialStep {
  key: 'gov-id' | 'coi' | 'guard-card' | 'pta-uof' | '32-hour';
  label: string;
  status: GuardApplicationCredentialStepStatus;
  /** Credential queue item id when staff can open a read-only preview. */
  credentialItemId: string | null;
}

export const GUARD_APPLICATION_CREDENTIAL_STATUS_LABELS: Record<
  GuardApplicationCredentialStepStatus,
  string
> = {
  pending: 'Pending',
  submitted: 'Submitted',
  verified: 'Verified',
};

function firstCertItemId(
  guard: SecurityGuard,
  matches: (catalogId: string) => boolean
): string | null {
  const certs = (guard.certifications ?? []).filter((cert) => matches(resolveCertCatalogId(cert)));
  if (!certs.length) return null;
  const withDocument = certs.find((cert) => certHasDocumentProof(cert));
  return (withDocument ?? certs[0]).id;
}

function govIdStatus(guard: SecurityGuard): GuardApplicationCredentialStepStatus {
  if (guardHasVerifiedIdForWork(guard)) return 'verified';
  const checklist = getGuardActivationChecklist(guard);
  if (checklist.idSubmitted) return 'submitted';
  return 'pending';
}

function coiStatus(guard: SecurityGuard): GuardApplicationCredentialStepStatus {
  const checklist = getGuardActivationChecklist(guard);
  if (checklist.insuranceVerified) return 'verified';
  if (guardHasInsuranceSubmitted(guard) || checklist.insuranceSubmitted) return 'submitted';
  return 'pending';
}

function guardCardStatus(guard: SecurityGuard): GuardApplicationCredentialStepStatus {
  const checklist = getGuardActivationChecklist(guard);
  if (checklist.guardCardVerified) return 'verified';
  if (guardMeetsLevel1(guard) || checklist.guardCardSubmitted) return 'submitted';
  return 'pending';
}

function ptaUofStatus(guard: SecurityGuard): GuardApplicationCredentialStepStatus {
  if (guardMeetsPtaUofTrainingVerified(guard)) return 'verified';
  if (guardMeetsPtaUofTraining(guard)) return 'submitted';
  return 'pending';
}

function thirtyTwoHourStatus(guard: SecurityGuard): GuardApplicationCredentialStepStatus {
  if (guardMeets32HourBlockVerified(guard)) return 'verified';
  if (guardMeets32HourBlock(guard)) return 'submitted';
  return 'pending';
}

export function getGuardApplicationCredentialSteps(guard: SecurityGuard): GuardApplicationCredentialStep[] {
  const govStatus = govIdStatus(guard);
  const insuranceStatus = coiStatus(guard);
  const cardStatus = guardCardStatus(guard);
  const ptaStatus = ptaUofStatus(guard);
  const blockStatus = thirtyTwoHourStatus(guard);

  return [
    {
      key: 'gov-id',
      label: 'Government ID',
      status: govStatus,
      credentialItemId: govStatus === 'pending' ? null : govIdApprovalItemId(guard.id),
    },
    {
      key: 'coi',
      label: 'Certificate of Insurance',
      status: insuranceStatus,
      credentialItemId: insuranceStatus === 'pending' ? null : coiApprovalItemId(guard.id),
    },
    {
      key: 'guard-card',
      label: 'BSIS Guard Card',
      status: cardStatus,
      credentialItemId:
        cardStatus === 'pending'
          ? null
          : (() => {
              const cards = getGuardCardCertifications(guard);
              const withDocument = cards.find((cert) => certHasDocumentProof(cert));
              return (withDocument ?? cards[0])?.id ?? null;
            })(),
    },
    {
      key: 'pta-uof',
      label: 'PTA/UOF training',
      status: ptaStatus,
      credentialItemId: ptaStatus === 'pending' ? null : firstCertItemId(guard, isPtaUofCatalogId),
    },
    {
      key: '32-hour',
      label: '32-hour BSIS block',
      status: blockStatus,
      credentialItemId: blockStatus === 'pending' ? null : firstCertItemId(guard, isThirtyTwoHourCatalogId),
    },
  ];
}
