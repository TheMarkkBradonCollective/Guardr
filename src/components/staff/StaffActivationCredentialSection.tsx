import React from 'react';
import { BookOpen, Shield } from 'lucide-react';
import type { SecurityGuard } from '../../types';
import type { ActivationCredentialKey } from '../../lib/guardCredentialSections';
import {
  getContinuingEducationSectionStatus,
  getGuardCardSectionStatus,
  getMandatoryTrainingSectionStatus,
  getPtaUofSectionStatus,
  getThirtyTwoHourSectionStatus,
} from '../../lib/credentialSectionStatus';
import { getCourseUploadStatus } from '../../lib/certStatus';
import { LEGACY_PTA_ID, THIRTY_TWO_HOUR_COURSE_IDS } from '../../lib/guardQualification';
import { CredentialRowAction, CredentialRowHeader } from '../credentials/CredentialStatusLabels';

const ACTIVATION_SECTION_CONFIG: Record<
  ActivationCredentialKey,
  {
    title: React.ReactNode;
    emptyMessage: string;
    sectionStatus: (guard: SecurityGuard) => ReturnType<typeof getGuardCardSectionStatus>;
    uploadStatus: (guard: SecurityGuard) => ReturnType<typeof getCourseUploadStatus>;
  }
> = {
  'guard-card': {
    title: (
      <p className="uber-label flex items-center gap-2 flex-wrap">
        <Shield className="w-4 h-4 text-brand-primary shrink-0" />
        BSIS Guard Card
      </p>
    ),
    emptyMessage: 'No guard card on file.',
    sectionStatus: (guard) => getGuardCardSectionStatus(guard, true),
    uploadStatus: (guard) => getCourseUploadStatus(guard, 'bsis-guard-card'),
  },
  'mandatory-training': {
    title: (
      <p className="uber-label flex items-center gap-2 flex-wrap">
        <BookOpen className="w-4 h-4 text-brand-primary shrink-0" />
        Mandatory training (PTA/UOF)
      </p>
    ),
    emptyMessage: 'No PTA/UOF mandatory training on file.',
    sectionStatus: (guard) => getMandatoryTrainingSectionStatus(guard, true),
    uploadStatus: (guard) => getCourseUploadStatus(guard, LEGACY_PTA_ID),
  },
  ce: {
    title: (
      <p className="uber-label flex items-center gap-2 flex-wrap">
        <BookOpen className="w-4 h-4 text-brand-primary shrink-0" />
        Continued Education
      </p>
    ),
    emptyMessage: 'No Continued Education courses on file (32-hour BSIS CE package).',
    sectionStatus: (guard) => getContinuingEducationSectionStatus(guard),
    uploadStatus: (guard) => getCourseUploadStatus(guard, THIRTY_TWO_HOUR_COURSE_IDS[0]),
  },
  'pta-uof': {
    title: (
      <p className="uber-label flex items-center gap-2 flex-wrap">
        <BookOpen className="w-4 h-4 text-brand-primary shrink-0" />
        Mandatory training (PTA/UOF)
      </p>
    ),
    emptyMessage: 'No PTA/UOF training on file.',
    sectionStatus: (guard) => getPtaUofSectionStatus(guard, true),
    uploadStatus: (guard) => getCourseUploadStatus(guard, LEGACY_PTA_ID),
  },
  '32-hour': {
    title: (
      <p className="uber-label flex items-center gap-2 flex-wrap">
        <BookOpen className="w-4 h-4 text-brand-primary shrink-0" />
        Continued Education
      </p>
    ),
    emptyMessage: 'No Continued Education courses on file.',
    sectionStatus: (guard) => getThirtyTwoHourSectionStatus(guard, true),
    uploadStatus: (guard) => getCourseUploadStatus(guard, THIRTY_TWO_HOUR_COURSE_IDS[0]),
  },
};

interface StaffActivationCredentialSectionProps {
  guard: SecurityGuard;
  stepKey: ActivationCredentialKey;
}

/** Staff credentials detail — matches Government ID section layout for pending uploads. */
export function StaffActivationCredentialSection({
  guard,
  stepKey,
}: StaffActivationCredentialSectionProps) {
  const config = ACTIVATION_SECTION_CONFIG[stepKey];

  return (
    <section className="app-form-section space-y-3">
      <CredentialRowHeader
        rawTitle
        title={config.title}
        action={
          <CredentialRowAction
            staffMode
            uploadStatus={config.uploadStatus(guard)}
            sectionStatus={config.sectionStatus(guard)}
            canUpload={false}
            onAdd={() => {}}
          />
        }
      />
      <p className="text-xs text-brand-text-muted py-3 border-t border-brand-border">
        {config.emptyMessage}
      </p>
    </section>
  );
}
