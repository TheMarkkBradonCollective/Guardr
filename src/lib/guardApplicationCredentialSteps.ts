import { SecurityGuard } from '../types';
import { certHasDocumentProof } from './certImagePolicy';
import { resolveCertCatalogId } from './certCatalog';
import { getGuardActivationChecklist, getGuardCardCertifications } from './guardAccountActivation';
import { coiApprovalItemId, govIdApprovalItemId } from './guardCredentialSections';
import { guardHasInsuranceSubmitted } from './guardInsurance';
import {
  guardHasVerifiedIdForWork,
  guardMeetsContinuingEducation,
  guardMeetsContinuingEducationVerified,
  guardMeetsLevel1,
  guardMeetsMandatoryTraining,
  guardMeetsMandatoryTrainingVerified,
  isContinuingEducationCatalogId,
  isPtaUofCatalogId,
} from './guardQualification';

export type GuardApplicationCredentialStepStatus = 'pending' | 'submitted' | 'verified';

export interface GuardApplicationCredentialStep {
  key: 'gov-id' | 'coi' | 'guard-card' | 'mandatory-training' | 'ce';
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

function mandatoryTrainingStatus(guard: SecurityGuard): GuardApplicationCredentialStepStatus {
  if (guardMeetsMandatoryTrainingVerified(guard)) return 'verified';
  if (guardMeetsMandatoryTraining(guard)) return 'submitted';
  return 'pending';
}

function continuingEducationStatus(guard: SecurityGuard): GuardApplicationCredentialStepStatus {
  if (guardMeetsContinuingEducationVerified(guard)) return 'verified';
  if (guardMeetsContinuingEducation(guard)) return 'submitted';
  return 'pending';
}

export function getGuardApplicationCredentialSteps(guard: SecurityGuard): GuardApplicationCredentialStep[] {
  const govStatus = govIdStatus(guard);
  const insuranceStatus = coiStatus(guard);
  const cardStatus = guardCardStatus(guard);
  const mandatoryStatus = mandatoryTrainingStatus(guard);
  const ceStatus = continuingEducationStatus(guard);

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
      key: 'mandatory-training',
      label: 'Mandatory training (PTA/UOF)',
      status: mandatoryStatus,
      credentialItemId:
        mandatoryStatus === 'pending' ? null : firstCertItemId(guard, isPtaUofCatalogId),
    },
    {
      key: 'ce',
      label: 'Continued Education',
      status: ceStatus,
      credentialItemId:
        ceStatus === 'pending' ? null : firstCertItemId(guard, isContinuingEducationCatalogId),
    },
  ];
}
